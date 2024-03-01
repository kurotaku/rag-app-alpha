import { useState } from 'react';
import { SerializableChoice } from '../../types/types';
import { useTheme } from '@mui/material/styles';
import Button from '@mui/material/Button';

type ButtonSelectProps = {
  name: string;
  choices: SerializableChoice[];
  setValue: (name: string, value: any) => void;
  onSelectionChange: (name: string, value: string) => void;
};

const ButtonSelect: React.FC<ButtonSelectProps> = ({
  name,
  choices,
  setValue,
  onSelectionChange,
}) => {
  const theme = useTheme();
  const [selected, setSelected] = useState<string | null>(null);

  const handleOptionClick = (value: string) => {
    setSelected(value);
    setValue(name, value);
    onSelectionChange(name, value);
  };

  return (
    <div>
      <input type='hidden' name={name} value={selected || ''} />

      {choices.map((choice, index) => (
        <Button
          variant="outlined"
          key={index}
          sx={{
            mr: 1,
            ...(selected === choice.id.toString() ? {background: `${theme.palette.primary.light} !important`} : null),
          }}
          onClick={() => handleOptionClick(choice.id.toString())}
        >
          {choice.name}
        </Button>
      ))}
    </div>
  );
};

export default ButtonSelect;
