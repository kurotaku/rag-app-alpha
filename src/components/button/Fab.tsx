
import { styled } from '@mui/material/styles';
import {Fab as MuiFab} from '@mui/material';

const Fab = styled(MuiFab)(() => ({
  position: 'fixed',
  right: '16px',
  bottom: '16px',
  '& *': {
    pointerEvents: 'none',
  },
}))
export default Fab;
