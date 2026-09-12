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
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("#masalah h3")).toHaveCount(3);

      const clipped = await page.locator("h1, #masalah h3").evaluateAll((headings) =>
        headings.flatMap((heading) => {
          const range = document.createRange();
          range.selectNodeContents(heading);
          const bounds = heading.getBoundingClientRect();
          const parent = heading.parentElement;
          if (!parent) throw new Error("Heading must have a container");
          const container = parent.getBoundingClientRect();
          const left = Math.max(0, container.left);
          const right = Math.min(window.innerWidth, container.right);
          const outside = Array.from(range.getClientRects()).some(
            (rect) => rect.left < left - 1 || rect.right > right + 1,
          );
          return outside || bounds.bottom > container.bottom + 1
            ? [
                {
                  text: heading.textContent,
                  left: bounds.left,
                  right: bounds.right,
                  container: { left, right },
                },
              ]
            : [];
        }),
      );
      expect(clipped).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    });
  }
}

test("homepage content and artwork load without runtime errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.reload();
  await expect(page.getByRole("heading", { level: 2 })).toHaveText([
    "EquiTeamitu apa sih?",
    "Relate dengan permasalahan ini?",
    "Solusi EquiTeam",
    "Manfaat untuk Semua",
    "Fokus pada Keadilan dan Keseimbangan",
    "LET’S KEEP IN TOUCH",
  ]);
  await expect(page.locator("img")).toHaveCount(25);
  await expect
    .poll(() =>
      page
        .locator("img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  await expect(page.getByRole("button", { name: "Masuk dengan Google" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Bahasa Indonesia" })).toBeDisabled();
  await expect(page.getByText(/membuka gerbang kesempatan/)).toHaveCSS("font-style", "normal");
  expect(errors).toEqual([]);
});

test("keyboard users can skip content and return from the footer", async ({ page }) => {
  await page.keyboard.press("Tab");
  const skip = page.getByRole("link", { name: "Lewati ke konten utama" });
  await expect(skip).toBeFocused();
  await expect(skip).toBeInViewport();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "EquiTeam, halaman utama" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "(0721) 8030188", exact: true })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "informatika@itera.ac.id", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  const back = page.getByRole("link", { name: "EquiTeam, kembali ke atas" });
  await expect(back).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toBeInViewport();
});
