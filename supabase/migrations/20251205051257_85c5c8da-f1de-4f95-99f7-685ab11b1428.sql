-- Fix: Drop the SECURITY DEFINER view and use application-level filtering instead
DROP VIEW IF EXISTS public.couples_safe;