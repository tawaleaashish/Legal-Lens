import * as React from 'react';
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
import Stack from '@mui/material/Stack';
import { styled } from '@mui/material/styles';

// Styled Button
const CustomButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#1FC1A2', // Button color
  color: '#fff',
  padding: '4px 8px',
  boxShadow: '0px 4px 10px rgba(25, 118, 210, 0.4)', // Glow effect
  '&:hover': {
    backgroundColor: '#07A688', // Hover color
    boxShadow: '0px 4px 10px rgba(25, 118, 210, 0.6)', // Intensified glow on hover
  },
  '& .MuiButton-endIcon': {
    marginLeft: '8px', // Spacing between text and icon
  },
  borderRadius: '8px', // Rounded corners
}));

export default function IconLabelButtons() {
  return (
    <Stack direction="row" spacing={2}>
      <CustomButton variant="contained" endIcon={<SendIcon />}>
        Send
      </CustomButton>
    </Stack>
  );
}
