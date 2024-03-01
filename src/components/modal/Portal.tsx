import React from 'react';
import ReactDOM from 'react-dom';

type PortalProps = {
  children: React.ReactNode;
};

const Portal: React.FC<PortalProps> = ({ children }) => {
  const element = document.querySelector('#__next');
  return element ? ReactDOM.createPortal(children, element) : null;
};

export default Portal;
