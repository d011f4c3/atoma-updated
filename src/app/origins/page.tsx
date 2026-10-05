import { OriginsPage } from "@/components/origins-page";
import { StorefrontFooter } from "@/components/storefront-footer";

export default function Page() {
  return (
    <>
      <OriginsPage />
      <StorefrontFooter year={new Date().getUTCFullYear()} />
    </>
  );
}
