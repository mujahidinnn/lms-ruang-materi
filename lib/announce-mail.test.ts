import { describe, expect, it } from "vitest";
import { announcementHtml } from "./announce-mail";

describe("announcementHtml", () => {
  it("escapes markup, splits paragraphs and makes relative links absolute", () => {
    const html = announcementHtml({ title: "<b>Hai</b>", body: "satu\n\ndua <script>", link: "/kelas" });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;b&gt;Hai&lt;/b&gt;");
    expect(html).toMatch(/satu<\/p><p [^>]*>dua &lt;script&gt;/);
    expect(html).toMatch(/href="https?:\/\/[^"]+\/kelas"/);
  });
});
