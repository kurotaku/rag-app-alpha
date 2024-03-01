import { createTheme, alpha } from '@mui/material/styles'
import { themeColors } from './colors'

export const theme = createTheme({
  palette: {
    primary: {
      main: themeColors.primary,
      light: alpha(themeColors.primary, 0.1),
    }
  }
})
