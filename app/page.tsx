import AspectRatioWrapper from "@/components/AspectRatioWrapper";
import Doorboard from "@/components/dashboard/doorboard";

export default function DashboardPage() {
  return (
    <AspectRatioWrapper ratioWidth={16} ratioHeight={9}>
      <Doorboard />
    </AspectRatioWrapper>
  );
}
