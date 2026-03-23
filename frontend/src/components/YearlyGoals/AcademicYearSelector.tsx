import React from 'react';
import { FormControl, Select, MenuItem, Typography, Box } from '@mui/material';
import { getCurrentAcademicYear } from '../../utils/academicYear';

interface AcademicYearSelectorProps {
  value: number;
  onChange: (year: number) => void;
}

function getYearOptions(): number[] {
  const current = getCurrentAcademicYear();
  const years: number[] = [];
  for (let y = current - 3; y <= current + 1; y++) {
    years.push(y);
  }
  return years;
}

const AcademicYearSelector: React.FC<AcademicYearSelectorProps> = ({ value, onChange }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography variant="body2" sx={{ color: 'inherit', whiteSpace: 'nowrap' }}>
        Academic Year:
      </Typography>
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <Select
          value={value}
          onChange={(e) => onChange(e.target.value as number)}
          sx={{
            color: 'inherit',
            '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
            '.MuiSvgIcon-root': { color: 'inherit' },
          }}
        >
          {getYearOptions().map((y) => (
            <MenuItem key={y} value={y}>
              {y}–{y + 1}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default AcademicYearSelector;
