import * as React from 'react';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';
import AttachFileIcon from '@mui/icons-material/AttachFile';

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
  minWidth: '40px', // Fixed width and height to make it circular
  width: '40px',
  height: '40px',
  borderRadius: '50%',
  padding: 0, // Remove default padding
  display: 'flex', // Center the icon
  alignItems: 'center',
  justifyContent: 'center',
  color: 'black',
  '&:hover': {
    boxShadow: '0px 4px 15px rgba(25, 118, 210, 0.6)', // Intensify glow on hover
  },
}));

export default function Uploadbutton({fileHandler}) {
  return (
    <StyledButton
      component="label">
      <AttachFileIcon />
    
      <VisuallyHiddenInput
        type="file"
        onChange={(event) => {console.log(event.target.files);
          fileHandler(event);
        }}
        multiple
      />
    </StyledButton>
  );
}
