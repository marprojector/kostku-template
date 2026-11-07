import { LoginGate } from "@/components/LoginGate";
import { Shell } from "@/components/Shell";

export default function Home() {
  return (
    <LoginGate>
      <Shell />
    </LoginGate>
  );
}
