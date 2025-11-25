import { Button } from '@/components/ui/button';
import { CITY_DATA, type City as TimezoneCity } from '@/utils/timezoneUtils';

export type City = TimezoneCity;

interface LocationToggleProps {
  selected: City;
  onChange: (city: City) => void;
}

export function LocationToggle({ selected, onChange }: LocationToggleProps) {
  const cities: City[] = ['London', 'Sydney', 'Melbourne', 'New York'];
  
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {cities.map(city => (
        <Button
          key={city}
          variant={selected === city ? 'default' : 'outline'}
          size="sm"
          onClick={() => onChange(city)}
          className="flex-none rounded-xl"
          aria-label={`Select ${city} as your location`}
        >
          <span className="mr-1" aria-hidden="true">{CITY_DATA[city].emoji}</span>
          {city}
        </Button>
      ))}
    </div>
  );
}
