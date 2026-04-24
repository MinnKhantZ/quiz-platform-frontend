import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 text-center px-4">
      <div className="relative">
        <p className="font-display text-[8rem] font-bold leading-none text-border select-none">
          404
        </p>
      </div>
      <div>
        <h1 className="font-display text-2xl font-bold">Page not found</h1>
        <p className="text-muted-foreground mt-2 max-w-sm">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
      </div>
      <Button onClick={() => navigate("/")}>Go Home</Button>
    </div>
  );
}
