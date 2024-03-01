import React from 'react';
import { styled, keyframes } from '@mui/system';
import { cyan } from '@mui/material/colors';

const loadingAnimation = keyframes`
  0%, 80%, 100% {
    transform: scale(0.5);
  }
  40% {
    transform: scale(1);
  }
`;

const DotWrap = styled('div')({
  display: 'flex',
  justifyContent: 'center',
  marginBottom: '24px',
});

const LoadingDot = styled('span')(() => ({
  display: 'inline-block',
  width: '6px',
  height: '6px',
  marginRight: '4px',
  borderRadius: '50%',
  backgroundColor: cyan[900],
  animation: `${loadingAnimation} 1.4s infinite`,
  '&:nth-of-type(2)': {
    animationDelay: '-0.7s',
  },
  '&:nth-of-type(3)': {
    animationDelay: '-0.3s',
  },
}));

const Loading = () => {
  return (
    <DotWrap>
      <LoadingDot />
      <LoadingDot />
      <LoadingDot />
    </DotWrap>
  );
};

export default Loading;
