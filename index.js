import fs from "node:fs";
import fetch from "node-fetch";
import iconv from "iconv-lite";
import { XMLParser } from "fast-xml-parser";
import AdmZip from "adm-zip";

async function downloadArchive(url) {
  const response = await fetch(url);
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync("./archive.zip", buffer);
}

async function extractArchive(filepath) {
  let filename = null;

  try {
    const zip = new AdmZip(filepath);

    zip.extractAllTo("./");

    const zipEntries = zip.getEntries();
    filename = zipEntries[0].entryName;
  } catch (error) {
    console.log(error);
  }

  return filename;
}

function parse(filename) {
  let result = [];

  const file = fs.readFileSync(filename);
  const decodeFile = iconv.decode(file, "win-1251");
  const parser = new XMLParser({ ignoreAttributes: false });

  let jObj = parser.parse(decodeFile);
  const entries = jObj.ED807.BICDirectoryEntry;

  for (const entry of entries) {
    if (entry.Accounts) {
      const bic = entry["@_BIC"];
      const name = entry.ParticipantInfo["@_NameP"];
      const accounts = entry.Accounts;

      if (accounts instanceof Array) {
        for (const account of accounts) {
          result.push({ bic, name, corrAccount: account["@_Account"] });
        }
      } else {
        result.push({ bic, name, corrAccount: accounts["@_Account"] });
      }
    }
  }

  return result;
}

await downloadArchive("http://www.cbr.ru/s/newbik");
const filename = await extractArchive("./archive.zip");
const parseData = parse(filename);

console.log(parseData);
