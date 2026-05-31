import React, { useEffect, useState } from 'react';
import {
  FormControl, InputLabel, Select, MenuItem, SelectChangeEvent,
} from '@mui/material';
import { getChildren } from '../api/parentChildApi';
import { ChildInfo } from '../types';

interface ChildSelectorProps {
  selectedChildId: string | null;
  onChange: (childId: string | null, childName?: string) => void;
}

const ChildSelector: React.FC<ChildSelectorProps> = ({ selectedChildId, onChange }) => {
  const [children, setChildren] = useState<ChildInfo[]>([]);

  useEffect(() => {
    getChildren()
      .then(setChildren)
      .catch(() => setChildren([]));
  }, []);

  const getChildName = (childId: string): string | undefined => {
    return children.find(c => c.id === childId)?.username;
  };

  const handleChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    if (value === '__self__') {
      onChange(null);
    } else {
      const name = getChildName(value);
      onChange(value, name);
    }
  };

  if (children.length === 0) {
    return null;
  }

  return (
    <FormControl size="small" sx={{ minWidth: 140, mx: 1 }}>
      <InputLabel id="child-selector-label" sx={{ color: 'inherit', '&.Mui-focused': { color: 'inherit' } }}>
        Viewing
      </InputLabel>
      <Select
        labelId="child-selector-label"
        value={selectedChildId ?? '__self__'}
        onChange={handleChange}
        label="Viewing"
        sx={{
          color: 'inherit',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'inherit' },
          '& .MuiSvgIcon-root': { color: 'inherit' },
        }}
      >
        <MenuItem value="__self__">My Schedule</MenuItem>
        {children.map((child) => (
          <MenuItem key={child.id} value={child.id}>
            {child.username}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default ChildSelector;