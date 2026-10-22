import { test } from "node:test";
import { FakeIntlProvider } from "@keybr/intl";
import { type PageData, PageDataContext } from "@keybr/pages-shared";
import { FakePhoneticModel } from "@keybr/phonetic-model";
import { PhoneticModelLoader } from "@keybr/phonetic-model-loader";
import { ConfusionStore, FakeResultContext, ResultFaker } from "@keybr/result";
import { FakeSettingsContext } from "@keybr/settings";
import { render } from "@testing-library/react";
import { isNotNull } from "rich-assert";
import { ProfilePage } from "./ProfilePage.tsx";

const faker = new ResultFaker();

test("render", async () => {
  PhoneticModelLoader.loader = FakePhoneticModel.loader;

  const r = render(
    <FakeIntlProvider>
      <PageDataContext.Provider
        value={{ publicUser: { id: "abc" } } as PageData}
      >
        <FakeSettingsContext>
          <FakeResultContext initialResults={faker.nextResultList(100)}>
            <ProfilePage />
          </FakeResultContext>
        </FakeSettingsContext>
      </PageDataContext.Provider>
    </FakeIntlProvider>,
  );

  isNotNull(await r.findByText("Typing Speed"));
  isNotNull(await r.findByText("Key Typing Speed"));
  isNotNull(await r.findByText("Confused Keys"));
  isNotNull(await r.findByText("Key Confusion Matrix"));

  r.unmount();
});

test("render key confusions", async () => {
  PhoneticModelLoader.loader = FakePhoneticModel.loader;
  window.localStorage.removeItem(ConfusionStore.key);

  const results = faker.nextResultList(100);
  const store = new ConfusionStore(window.localStorage);
  for (let i = 0; i < 42; i++) {
    store.append(results[0].layout, [
      { expected: /* "e" */ 0x0065, actual: /* "r" */ 0x0072 },
    ]);
  }

  const r = render(
    <FakeIntlProvider>
      <PageDataContext.Provider
        value={{ publicUser: { id: "abc" } } as PageData}
      >
        <FakeSettingsContext>
          <FakeResultContext initialResults={results}>
            <ProfilePage />
          </FakeResultContext>
        </FakeSettingsContext>
      </PageDataContext.Provider>
    </FakeIntlProvider>,
  );

  isNotNull(await r.findByText("×42"));
  isNotNull(await r.findByTitle("e → r ×42"));

  r.unmount();
  window.localStorage.removeItem(ConfusionStore.key);
});
