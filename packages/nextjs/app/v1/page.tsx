import { ArtworkDetail } from "@/components/ArtworkDetail";

export const metadata = {
  title: "V1 Original (2019) - This Artwork Is Always On Sale",
  description: "The original artwork from 2019, restored in 2021. 5% patronage rate.",
};

export default function V1Page() {
  return <ArtworkDetail version="v1" />;
}
