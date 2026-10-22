import { test } from "node:test";
import { Writer } from "@keybr/binary";
import { Layout } from "@keybr/keyboard";
import { Result, ResultFaker, TextType } from "@keybr/result";
import { Histogram } from "@keybr/textinput";
import { deepEqual, equal, isFalse, throws } from "rich-assert";
import { writeResult } from "./binary.ts";
import { InvalidFormatError } from "./errors.ts";
import { fileChunk, fileHeader, parseFile } from "./file.ts";
import { HEADER, HEADER_SIGNATURE, HEADER_VERSION } from "./header.ts";

test("format and parse results", () => {
  const faker = new ResultFaker();
  const result = faker.nextResult();

  const buffer = Buffer.concat([fileHeader(), fileChunk([result])]);

  equal(buffer.byteLength, 70);

  const iter = parseFile(buffer);

  deepEqual([...iter], [result]);
});

test("parse results stored in the existing format", () => {
  // A file with one result as it is persisted by the previous versions.
  // Key confusions are stored separately and are absent from the file.
  const buffer = Buffer.from(
    "4b4559420000000210013a7b7562e0397b0303610b016f621602815e632103824d",
    "hex",
  );

  const iter = parseFile(buffer);

  deepEqual(
    [...iter],
    [
      new Result(
        /* layout= */ Layout.EN_US,
        /* textType= */ TextType.GENERATED,
        /* timeStamp= */ Date.parse("2001-02-03T03:05:06Z"),
        /* length= */ 123,
        /* time= */ 12345,
        /* errors= */ 3,
        /* histogram= */ new Histogram([
          { codePoint: 0x0061, hitCount: 11, missCount: 1, timeToType: 111 },
          { codePoint: 0x0062, hitCount: 22, missCount: 2, timeToType: 222 },
          { codePoint: 0x0063, hitCount: 33, missCount: 3, timeToType: 333 },
        ]),
      ),
    ],
  );
});

test("deserialize should ignore empty data", () => {
  const iter = parseFile(new Uint8Array(0));

  deepEqual([...iter], []);
});

test("deserialize should validate file header", () => {
  const iter = parseFile(new Uint8Array(256));

  throws(() => [...iter], InvalidFormatError);
});

test("deserialize should validate file data", () => {
  const writer = new Writer();
  writer.putBuffer(HEADER);
  writer.putUint8(1);
  writer.putUint8(2);
  writer.putUint8(3);

  const iter = parseFile(writer.buffer());

  throws(() => [...iter], InvalidFormatError);
});

test("deserialize should read invalid results", () => {
  const result = new Result(
    /* layout= */ Layout.EN_US,
    /* textType= */ TextType.GENERATED,
    /* timeStamp= */ Date.parse("2001-02-03T03:05:06Z"),
    /* length= */ 0,
    /* time= */ 0,
    /* errors= */ 0,
    /* histogram= */ new Histogram([]),
  );

  isFalse(result.validate());

  const writer = new Writer();
  writer.putUint32(HEADER_SIGNATURE);
  writer.putUint32(HEADER_VERSION);
  writeResult(writer, result);

  const parsed = [...parseFile(writer.buffer())];

  deepEqual(parsed, [result]);
});
