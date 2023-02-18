import puppeteer, { ElementHandle } from "puppeteer";
import fs from "fs";
import path from "path";

const URL = "https://unicode.org/emoji/charts/full-emoji-list.html";

const fileName = "./src/core/out.json";

type IUnicodeEmojiItem = {
  code: string[];
  shortName: string;
  imageUrl: string;
};

type IGroup = { group: string; emojiList: IUnicodeEmojiItem[] };

type ICategory = {
  category: string;
  groups: IGroup[];
};

type IRole = "category" | "groups" | "emoji";

const checkRowRole = async (rowHandler: ElementHandle<HTMLTableRowElement>) => {
  const bigHeadCell = await rowHandler.$("th.bighead");
  if (bigHeadCell) {
    return {
      role: <IRole>"category",
      content: await bigHeadCell.evaluate((i) => i.textContent),
    };
  }
  const mediumHeadCell = await rowHandler.$("th.mediumhead");
  if (mediumHeadCell) {
    return {
      role: <IRole>"groups",
      content: await mediumHeadCell.evaluate((i) => i.textContent),
    };
  }
  const [char, url, name] = await Promise.all([
    rowHandler
      .$("td.code")
      .then((cellHandler) =>
        cellHandler ? cellHandler.evaluate((i) => i.textContent) : null
      ),
    rowHandler
      .$("td:nth-child(6)>img")
      .then((imageHandler) =>
        imageHandler ? imageHandler.evaluate((i) => i.src) : null
      ),
    rowHandler
      .$("td.name")
      .then((cellHandler) =>
        cellHandler ? cellHandler.evaluate((i) => i.textContent) : null
      ),
  ]);

  if ([char, url, name].some((i) => !i)) {
    return null;
  }
  return {
    role: "emoji" as IRole,
    content: {
      code: char!.split(" "),
      imageUrl: url,
      shortName: name,
    } as IUnicodeEmojiItem,
  };
};

const saveToFile = async (res: ICategory[]) => {
  const formatedRes = res.reduce((p, c) => {
    return {
      ...p,
      [c.category]: c.groups.reduce((a, b) => {
        return { ...a, [b.group]: b.emojiList };
      }, {}),
    };
  }, {});
  const writeStream = fs.createWriteStream(
    path.resolve(process.cwd(), fileName)
  );

  writeStream.write(JSON.stringify(formatedRes));
};

export const main = async () => {
  const emojiList: IUnicodeEmojiItem[] = [];

  const browser = await puppeteer.launch({
    headless: false,
    timeout: 360000,
  });
  const page = await browser.newPage();

  page.setDefaultNavigationTimeout(360000);

  await page.goto(URL, {
    waitUntil: "networkidle0",
  });
  console.log("After goto");

  // Set screen size
  await page.setViewport({ width: 1920, height: 1600 });

  console.log("After set viewport");

  // Type into search box

  const table = await page.$("table");
  const tableRows = await table?.$$("tr");
  if (!tableRows) return;
  const output: ICategory[] = [];

  const handleRow = async (
    rowHandler: ElementHandle<HTMLTableRowElement>,
    rowIndex: number
  ) => {
    console.log(`Handling row ${rowIndex}`);

    const res = await checkRowRole(rowHandler);
    if (!res) return;
    const { content, role } = res;
    if (role === "category") {
      output.push({ category: content as string, groups: [] });
      return;
    }
    if (role === "groups") {
      output[output.length - 1]?.groups.push({
        group: content as string,
        emojiList: [],
      });
      return;
    }
    const groupListOfLatestCat = output[output.length - 1]?.groups;
    if (!groupListOfLatestCat) return;
    groupListOfLatestCat[groupListOfLatestCat.length - 1]?.emojiList.push(
      content as IUnicodeEmojiItem
    );
  };

  for (const [index, row] of tableRows.entries()) {
    await handleRow(row, index);
  }

  console.log({ output });

  await saveToFile(output);

  await browser.close();
};

main();
