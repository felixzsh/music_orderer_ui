import { Download, X } from 'lucide-react';
import { useContext, useState } from 'react';
import { PendingRequestsContext } from './PendingRequestsContext';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { HierarchicalSongList } from './HierarchicalSongList';
import { SongGroup } from '../types/api';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface SongPreviewProps {
  songGroups: { [key: string]: SongGroup };
  totalSongs: number;
  onDeleteSong: (songId: string) => void;
  onMoveSong: (songId: string, sourceTag: string, destTag: string, newIndex: number) => void;
  onSendRequest: (deliveryType: 'DIGITAL_LINK' | 'PHYSICAL_USB') => void;
  onDeleteGroup: (groupName: string) => void;
  onReSearch: (songId: string) => void;
  onUpdateSong: (songId: string, updates: { title?: string; artist?: string }) => void;
  phoneNumber: string;
}

export function SongPreview({ 
  songGroups, 
  totalSongs, 
  onDeleteSong, 
  onMoveSong, 
  onSendRequest, 
  onDeleteGroup,
  onReSearch,
  onUpdateSong,
  phoneNumber
}: SongPreviewProps) {
  const { pending, cancelAll, skipCount, resetSkips } = useContext(PendingRequestsContext);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [deliveryType, setDeliveryType] = useState<'DIGITAL_LINK' | 'PHYSICAL_USB'>('DIGITAL_LINK');
  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <span>Preview</span>
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            {totalSongs} cancion{totalSongs !== 1 ? 'es' : ''}
            {pending > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 text-xs font-semibold flex items-center gap-1">
                busquedas en cola: {pending}
                <button
                  onClick={cancelAll}
                  className="ml-1 hover:text-red-600 transition-colors"
                  title="Cancelar todas las búsquedas"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {skipCount > 0 && (
              <span
                className="ml-2 px-2 py-0.5 rounded bg-orange-100 text-orange-800 text-xs font-semibold flex items-center gap-1 cursor-pointer hover:bg-orange-200 transition-colors"
                onClick={resetSkips}
                title="Limpiar contador de duplicados"
              >
                duplicados: {skipCount}
                <X className="h-3 w-3" />
              </span>
            )}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <ScrollArea className="flex-1 min-h-0">
          <HierarchicalSongList
            songGroups={songGroups}
            onDeleteSong={onDeleteSong}
            onMoveSong={onMoveSong}
            onDeleteGroup={onDeleteGroup}
            onReSearch={onReSearch}
            onUpdateSong={onUpdateSong}
          />
        </ScrollArea>
        {totalSongs > 0 && (
          <div className="flex-shrink-0 mt-4 pt-4 border-t">
            <Button 
              onClick={() => {
                if (phoneNumber.startsWith('521899')) {
                  setIsDeliveryDialogOpen(true);
                } else {
                  onSendRequest('DIGITAL_LINK');
                }
              }}
              className="w-full"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Enviar Request
            </Button>

            <AlertDialog open={isDeliveryDialogOpen} onOpenChange={setIsDeliveryDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Cómo quieres recibir tu paquete musical?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Selecciona el método de entrega que prefieres
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDeliveryType('DIGITAL_LINK');
                      onSendRequest('DIGITAL_LINK');
                      setIsDeliveryDialogOpen(false);
                    }}
                  >
                    Link de descarga
                  </Button>
                  <Button
                    onClick={() => {
                      setDeliveryType('PHYSICAL_USB');
                      onSendRequest('PHYSICAL_USB');
                      setIsDeliveryDialogOpen(false);
                      // Reset to default after sending
                      setDeliveryType('DIGITAL_LINK');
                    }}
                  >
                    USB físico
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}