# Sample pouch QR assets — Task 0173

The three sticker QR codes link to the existing product routes in
`src/lib/sample-set.ts` and `src/lib/product-codes.ts`. Their origin is the review
site configured by `metadataBase` in `src/app/layout.tsx`; no new redirect,
tracking service or product identity was introduced.

| Asset in `public/images/samples/qr/` | Product code | Encoded destination                                                                                   |
| ------------------------------------ | ------------ | ----------------------------------------------------------------------------------------------------- |
| `ceremonial.svg`                     | WZKA-00      | `https://atoma-updated.vercel.app/shop/test-only-japanese-premium-matcha-powder-for-tea-service-1-kg` |
| `barista.svg`                        | UJI-00       | `https://atoma-updated.vercel.app/shop/test-only-japanese-barista-matcha-powder-for-lattes-1-kg`      |
| `culinary.svg`                       | UJI-01       | `https://atoma-updated.vercel.app/shop/jmm-storefront-test-matcha`                                    |

## Construction and verification

Generated locally with pinned **Segno 1.6.6** in an ignored temporary Python
environment. There are no new project or runtime dependencies. The command for
each destination is equivalent to:

```python
import segno

qr = segno.make_qr(destination, error="m", boost_error=False)
qr.save(
    filename,
    scale=1,
    border=4,
    dark="#000",
    light="#f4f1e7",
    xmldecl=False,
    svgns=True,
    svgclass=None,
    lineclass=None,
)
```

The assets use error correction **M** and an opaque **four-module quiet zone**.
Ceremonial and Barista are QR version 6, with 49 × 49 modules including the
border. Culinary is version 5, with 45 × 45 modules including the border. Do not
crop the quiet zone, add an overlaid logo, or recolour the black modules.

On 2026-10-18, every saved SVG was rasterized independently using the bundled
Sharp runtime at 8 pixels per module, then decoded using pinned **ZXing-C++
2.3.0** with **Pillow 11.3.0**. All three decoded to their exact destinations
above, without thresholding or other image modification. Both libraries were
temporary verification tools only. No asset or URL was uploaded to a QR service.

Reference: [Segno API and quiet-zone documentation](https://segno.readthedocs.io/en/stable/api.html)
and [ZXing-C++ Python bindings](https://pypi.org/project/zxing-cpp/).

## Before physical printing

This is the website packaging study. Confirm the public production origin and
permanent product handles before printing stickers, then regenerate and scan
the final artwork at its intended physical size. The current review-domain QR
destination does not imply that the website has been published or that these
are final production labels.
