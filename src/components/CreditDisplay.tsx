import { Card, CardContent } from "@/components/ui/card";
import { Coins } from "lucide-react";

interface CreditDisplayProps {
  credits: number;
}

const CreditDisplay = ({ credits }: CreditDisplayProps) => {
  return (
    <Card className="shadow-card bg-gradient-primary text-white border-0">
      <CardContent className="p-3 flex items-center space-x-2">
        <Coins className="w-5 h-5" />
        <div>
          <p className="text-xs opacity-90">Credits</p>
          <p className="text-lg font-bold">{credits}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreditDisplay;
