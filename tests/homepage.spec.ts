import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
});

for (const width of [320, 390, 412, 480, 768, 769, 820, 896, 897, 1024, 1088, 1089, 1440]) {
  for (const fontSize of [16, 32]) {
    test(`headings fit at ${width}px with ${fontSize}px root text`, async ({ page }) => {
      await page.setViewportSize({ width, height: 915 });
      await page.evaluate((size) => {
        document.documentElement.style.fontSize = `${size}px`;
      }, fontSize);
      for (const name of [
        /Di Mana Keadilan Menciptakan Keunggulan/,
        /Partisipasi tim tidak merata/,
        /Terdapat kelompok terbuang/,
        /Keahlian di tim tidak seimbang/,
      ]) {
        const heading = page.getByRole("heading", { name });
        await expect(heading).toBeVisible();
        const textLayout = await heading.evaluate((element) => {
          const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
          const rects: DOMRect[] = [];
          for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            if (!node.textContent?.trim()) continue;
            const range = document.createRange();
            range.selectNodeContents(node);
            rects.push(...range.getClientRects());
          }
          let left = 0;
          let right = window.innerWidth;
          let top = -Infinity;
          let bottom = Infinity;
          for (
            let ancestor: Element | null = element;
            ancestor;
            ancestor = ancestor.parentElement
          ) {
            const css = getComputedStyle(ancestor);
            const bounds = ancestor.getBoundingClientRect();
            if (["hidden", "clip"].includes(css.overflowX)) {
              left = Math.max(left, bounds.left + ancestor.clientLeft);
              right = Math.min(right, bounds.left + ancestor.clientLeft + ancestor.clientWidth);
            }
            if (["hidden", "clip"].includes(css.overflowY)) {
              top = Math.max(top, bounds.top + ancestor.clientTop);
              bottom = Math.min(bottom, bounds.top + ancestor.clientTop + ancestor.clientHeight);
            }
          }
          return {
            hasRenderedText: rects.some((rect) => rect.width > 0 && rect.height > 0),
            fits: rects.every(
              (rect) =>
                rect.left >= left - 1 &&
                rect.right <= right + 1 &&
                rect.top >= top - 1 &&
                rect.bottom <= bottom + 1,
            ),
          };
        });
        expect(textLayout).toEqual({ hasRenderedText: true, fits: true });
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    });
  }
}

test("the fairness statement uses upright text", async ({ page }) => {
  const statement = page.getByText(/membuka gerbang kesempatan/);
  await expect(statement).toBeVisible();
  await expect(statement).toHaveCSS("font-style", "normal");
});

test("keyboard users can skip content and return from the footer", async ({ page }) => {
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Lewati ke konten utama" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();
  const back = page.getByRole("link", { name: "EquiTeam, kembali ke atas" });
  const focusableCount = await page.locator("a[href], button:not([disabled]), [tabindex]").count();
  for (let step = 0; step < focusableCount; step++) {
    await page.keyboard.press("Tab");
    if (await back.evaluate((element) => element === document.activeElement)) break;
  }
  await expect(back).toBeFocused();
  await expect(back).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();
});
