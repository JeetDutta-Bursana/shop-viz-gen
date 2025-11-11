import { Card, CardContent } from "@/components/ui/card";
import { Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CreditDisplayProps {
  credits: number;
  onClick?: () => void;
}

const CreditDisplay = ({ credits, onClick }: CreditDisplayProps) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate("/pricing");
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <CardContent className="px-4 py-2">
        <div className="flex items-center space-x-2">
          <Coins className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="text-xs text-gray-600 font-medium">Credits</p>
            <p className="text-lg font-bold text-gray-900">{credits}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreditDisplay;
