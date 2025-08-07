import { Card, CardContent } from "@/components/ui/card";

interface StatsCardsProps {
  quantity: string;
}

export const StatsCards = ({ quantity }: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-xl text-gray-600 font-bold">Increase TXNS</div>
            <div className="text-gray-500">{quantity} BUY 0 SELL</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-xl text-gray-600 font-bold">
              Increase Token Holders
            </div>
            <div className="text-gray-500">{quantity}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-xl text-gray-600 font-bold">
              Increase Wallet(↑MAKERS) Buy
            </div>
            <div className="text-gray-500">{quantity}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
