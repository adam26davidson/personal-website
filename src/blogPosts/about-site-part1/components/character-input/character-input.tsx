import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CharacterInput({
  char,
  label,
  setChar,
}: {
  char: string;
  label: string;
  setChar: (value: string) => void;
}) {
  const handleCharChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newChar = e.target.value;
    if (newChar.length === 0) {
      setChar(""); // user pressed backspace
      //ensure character is not space
    } else if (newChar.length >= 1 && newChar.slice(-1).trim() !== "") {
      // Always take only the last typed character
      setChar(newChar.slice(-1));
    }
  };
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <Input
        type="text"
        value={char}
        onChange={handleCharChange}
        className="w-20"
      ></Input>
    </div>
  );
}
