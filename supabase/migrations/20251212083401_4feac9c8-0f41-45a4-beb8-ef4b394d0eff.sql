-- Drop and recreate the join function with internal verification and detailed error reporting
DROP FUNCTION IF EXISTS public.join_couple_with_code(text);

CREATE OR REPLACE FUNCTION public.join_couple_with_code(input_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_couple couples%ROWTYPE;
  current_user_id uuid;
  verified_partner_two uuid;
  rows_updated integer;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  
  RAISE LOG '[JOIN_FUNC] Starting join for user: %, code: %', current_user_id, input_code;
  
  IF current_user_id IS NULL THEN
    RAISE LOG '[JOIN_FUNC] ERROR: Not authenticated';
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;
  
  -- Find and lock the couple row to prevent race conditions
  SELECT * INTO target_couple
  FROM couples
  WHERE couple_code = input_code
    AND partner_two IS NULL
    AND is_active = true
    AND code_expires_at > now()
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE LOG '[JOIN_FUNC] ERROR: Code not found or expired: %', input_code;
    RETURN jsonb_build_object('success', false, 'error', 'Code not found or expired. Check with your partner.');
  END IF;
  
  RAISE LOG '[JOIN_FUNC] Found couple: %, partner_one: %', target_couple.id, target_couple.partner_one;
  
  -- Check not joining own couple
  IF target_couple.partner_one = current_user_id THEN
    RAISE LOG '[JOIN_FUNC] ERROR: User trying to join own couple';
    RETURN jsonb_build_object('success', false, 'error', 'You cannot join your own couple code!');
  END IF;
  
  -- Perform the join - this bypasses RLS since we're SECURITY DEFINER
  UPDATE couples
  SET partner_two = current_user_id
  WHERE id = target_couple.id
    AND partner_two IS NULL;  -- Extra safety check
  
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RAISE LOG '[JOIN_FUNC] UPDATE executed, rows affected: %', rows_updated;
  
  IF rows_updated = 0 THEN
    RAISE LOG '[JOIN_FUNC] ERROR: No rows updated - race condition?';
    RETURN jsonb_build_object('success', false, 'error', 'Join failed - someone else may have joined first');
  END IF;
  
  -- CRITICAL: Verify the update actually persisted by re-reading
  SELECT partner_two INTO verified_partner_two
  FROM couples
  WHERE id = target_couple.id;
  
  RAISE LOG '[JOIN_FUNC] Verification - expected: %, actual: %', current_user_id, verified_partner_two;
  
  IF verified_partner_two IS NULL THEN
    RAISE LOG '[JOIN_FUNC] CRITICAL ERROR: partner_two is NULL after UPDATE!';
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Database update failed to persist - partner_two is NULL',
      'debug', jsonb_build_object(
        'expected', current_user_id::text,
        'actual', 'NULL',
        'couple_id', target_couple.id::text
      )
    );
  END IF;
  
  IF verified_partner_two != current_user_id THEN
    RAISE LOG '[JOIN_FUNC] CRITICAL ERROR: partner_two mismatch! Expected: %, Got: %', current_user_id, verified_partner_two;
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Database update failed - partner_two mismatch',
      'debug', jsonb_build_object(
        'expected', current_user_id::text,
        'actual', verified_partner_two::text,
        'couple_id', target_couple.id::text
      )
    );
  END IF;
  
  RAISE LOG '[JOIN_FUNC] SUCCESS: User % joined couple %', current_user_id, target_couple.id;
  
  -- Return success with complete couple data
  RETURN jsonb_build_object(
    'success', true,
    'couple_id', target_couple.id,
    'partner_one', target_couple.partner_one,
    'partner_two', current_user_id,
    'verified', true
  );
END;
$$;