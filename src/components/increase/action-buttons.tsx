import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Play } from 'lucide-react';

interface ActionButtonsProps {
  isLoading: boolean;
  showNewRun: boolean;
  onDownload: () => void;
  onNewRun: (event: React.MouseEvent) => void;
}

export const ActionButtons = ({
  isLoading,
  showNewRun,
  onDownload,
  onNewRun,
}: ActionButtonsProps) => {
  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <Button
          variant="outline"
          className="w-full"
          type="button"
          onClick={onDownload}
          disabled={isLoading}
        >
          <Download className="h-4 w-4 mr-2" />
          Download wallet address info
        </Button>

        {showNewRun ? (
          <Button
            type="button"
            className="w-full bg-black hover:bg-gray-600"
            size="lg"
            onClick={onNewRun}
          >
            <Play className="h-4 w-4 mr-2" />
            New
          </Button>
        ) : (
          <Button
            type="submit"
            className="w-full bg-black hover:bg-gray-600 disabled:bg-gray-400"
            size="lg"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                RUN
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
