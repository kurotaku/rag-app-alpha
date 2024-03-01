import React from 'react';
import Portal from './Portal';
import styles from './Modal.module.scss';
import { IconButton } from '@mui/material';

type Props = {
  title?: string;
  close: (e: any) => void;
  children: React.ReactNode;
};

const Modal: React.FC<Props> = (props) => {
  return (
    <Portal>
      <div className={styles.modal}>
        <div>
          <header>
            {props.title && <div>{props.title}</div>}
            <IconButton aria-label="close" onClick={props.close} />
          </header>
          <div>{props.children}</div>
        </div>
      </div>
    </Portal>
  );
};

export default Modal;
