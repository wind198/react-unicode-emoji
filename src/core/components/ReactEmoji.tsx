import { ForwardedRef, forwardRef, HTMLAttributes, useMemo } from "react";
import json from "../out.json";

export type ICategoryName = string;
export type IGroupName = string;

export type IUnicodeEmojiItem = {
  code: string[];
  shortName: string;
  imageUrl: string;
};

export const EmojiMap = json as Record<
  ICategoryName,
  Record<IGroupName, IUnicodeEmojiItem[]>
>;
console.log(EmojiMap);

type IReactEmojiProps = Omit<
  HTMLAttributes<HTMLImageElement>,
  "src" | "alt"
> & { code: string; group: string; category: string };

function ReactEmoji(
  props: IReactEmojiProps,
  ref: ForwardedRef<HTMLImageElement>
) {
  const { code, category, group, style, ...others } = props;
  const matchedEmoji = useMemo(() => {
    const cat = EmojiMap[category];
    const emojiGroup = cat?.[group];
    return emojiGroup?.find((e) => e.code.includes(code));
  }, []);

  if (!matchedEmoji) {
    console.error("Invalid code");
    return null;
  }

  return (
    <img
      src={matchedEmoji.imageUrl}
      alt={matchedEmoji.shortName}
      style={{
        width: "1em",
        height: "1em",
        objectFit: "cover",
      }}
      {...others}
    />
  );
}

export default forwardRef(ReactEmoji);
