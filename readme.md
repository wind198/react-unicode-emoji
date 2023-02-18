# React emoji

## Introduction

A react component that render Unicode emoji listed in the link
[Unicode Emoji](https://unicode.org/emoji/charts/full-emoji-list.html).

All you need to do is provide 3 information, the category, the group and the code, which you can consult from the link above.

```javascript
import ReactEmoji from "./core/components/ReactEmoji";

function App() {
  return (
    <div>
      <ReactEmoji
        category="Smileys & Emotion"
        group="face-smiling"
        code="U+1F600"
      />
    </div>
  );
}

export default App;
```
