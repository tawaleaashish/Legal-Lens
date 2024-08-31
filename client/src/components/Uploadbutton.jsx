import * as React from 'react';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const StyledButton = styled(Button)(({ theme }) => ({
  marginTop: '-10px', // Move button up
  backgroundColor: '#1FC1A2', // Change color
  color: '#fff',
  boxShadow: '0px 4px 15px rgba(25, 118, 210, 0.4)', // Glow effect
  '&:hover': {
    backgroundColor: '#07A688', // Darken color on hover
    boxShadow: '0px 4px 15px rgba(25, 118, 210, 0.6)', // Intensify glow on hover
  },
}));

export default function Uploadbutton() {
  return (
    <StyledButton
      component="label"
      startIcon={<CloudUploadIcon />}
    >
      Upload files
      <VisuallyHiddenInput
        type="file"
        onChange={(event) => console.log(event.target.files)}
        multiple
      />
    </StyledButton>
  );
}
