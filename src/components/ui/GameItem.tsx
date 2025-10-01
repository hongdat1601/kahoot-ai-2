import React, { useState } from 'react';
import { MoreVertical, Edit, X, RotateCcw, Trash2, Gamepad2 } from 'lucide-react';
import { Game, GameState } from '@/types/api';

export interface GameProps extends Game {
  image?: string;
  lobbyCode?: string;
  playerCount?: number;
};

interface GameItemProps {
  game: GameProps;
  view?: 'card' | 'list';
  onClick?: (id: string) => void;
  onEdit?: (id: string) => void;
  onToggleStatus?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function GameItem({ game, view = 'card', onClick, onEdit, onToggleStatus, onDelete }: GameItemProps) {
  const [open, setOpen] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  const handleNavigate = () => {
    if (onClick) onClick(game.id);
  };

  const statusBadge = () => {
    if (game.state === GameState.Active) return 'bg-green-100 text-green-800';
    if (game.state === GameState.Draft) return 'bg-yellow-100 text-yellow-800';
    if (game.state === GameState.InLobby) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatus = (state : GameState | undefined) => {
    switch (state) {
      case GameState.Active:
        return 'Active';
      case GameState.Draft:
        return 'Draft';
      case GameState.InActive:
        return 'In-Active';
      case GameState.InLobby:
        return 'In-Lobby';
      default:
        return '';
    }
  }

  return (
    <>
      {view === 'card' ? (
        <div
          className="bg-white rounded-lg border border-gray-200 shadow-sm  relative cursor-pointer hover:shadow-md transition-shadow"
          onClick={handleNavigate}
        >
          <div className="h-32 bg-gray-200 flex items-center justify-center">
            {game.image && !imageFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={game.image} alt={game.title ?? undefined} className="object-cover h-full w-full" onError={() => setImageFailed(true)} />
            ) : (
              <Gamepad2 className="h-12 w-12 text-gray-400" />
            )}
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-medium text-gray-900 text-sm line-clamp-2 flex-1 pr-2">{game.title}</h3>

              <div className="relative flex-shrink-0 z-30" onClick={(e) => { e.stopPropagation(); }}>
                <button
                  onClick={() => setOpen(!open)}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                >
                  <MoreVertical className="h-4 w-4 text-gray-600" />
                </button>

                {open && (
                  <>
                    <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[70]">
                      <button
                        onClick={() => { onEdit?.(game.id); setOpen(false); }}
                        className={`w-full px-3 py-2 text-left text-sm flex items-center space-x-2 ${game.state === GameState.Active ? 'text-gray-700 hover:bg-gray-50' : 'text-green-600 hover:bg-green-50'}`}
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => { onToggleStatus?.(game.id); setOpen(false); }}
                        className={`w-full px-3 py-2 text-left text-sm flex items-center space-x-2 ${game.state === GameState.Active ? 'text-gray-700 hover:bg-gray-50' : 'text-green-600 hover:bg-green-50'}`}
                      >
                        {game.state === GameState.Active ? <X className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                        <span>{game.state === GameState.Active ? 'Close' : 'Active'}</span>
                      </button>

                      {(game.state === GameState.Draft || game.state === GameState.InActive) 
                        && <button
                        onClick={() => { onDelete?.(game.id); setOpen(false); }}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className={`inline-block px-2 py-1 text-xs rounded ${statusBadge()}`}>
                {getStatus(game.state)}
              </span>

              {game.state === GameState.InLobby ? (
                <div className="text-xs text-purple-600 space-y-1">
                  <p>Code: {game.lobbyCode}</p>
                  <p>{game.playerCount} players joined</p>
                </div>
              ) : (
                <div className="text-xs text-gray-500 space-y-1">
                  <p>Created: {game.createdOn ? new Date(game.createdOn).toLocaleDateString() : ''}</p>
                  <p>Modified: {game.updatedOn ? new Date(game.updatedOn).toLocaleDateString() : ''}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div
          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
          onClick={handleNavigate}
        >
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
              {game.image && !imageFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={game.image} alt={game.title ?? undefined} className="h-full w-full object-cover rounded" onError={() => setImageFailed(true)} />
              ) : (
                <Gamepad2 className="h-6 w-6 text-gray-400" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{game.title}</h3>
              <div className="flex items-center space-x-3 mt-1">
                <span className={`px-2 py-1 text-xs rounded ${statusBadge()}`}>
                  {getStatus(game.state)}
                </span>
                <span className="text-xs text-gray-500">Created: {game.createdOn ? new Date(game.createdOn).toLocaleDateString() : ''}</span>
                <span className="text-xs text-gray-500">Modified: {game.updatedOn ? new Date(game.updatedOn).toLocaleDateString() : ''}</span>
              </div>
            </div>
          </div>

          <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setOpen(!open)} className="p-1 rounded hover:bg-gray-100 transition-colors">
              <MoreVertical className="h-4 w-4 text-gray-600" />
            </button>

            {open && (
              <>
                <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[70]">
                  <button
                        onClick={() => { onEdit?.(game.id); setOpen(false); }}
                        className={`w-full px-3 py-2 text-left text-sm flex items-center space-x-2 ${game.state === GameState.Active ? 'text-gray-700 hover:bg-gray-50' : 'text-green-600 hover:bg-green-50'}`}
                      >
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => { onToggleStatus?.(game.id); setOpen(false); }}
                        className={`w-full px-3 py-2 text-left text-sm flex items-center space-x-2 ${game.state === GameState.Active ? 'text-gray-700 hover:bg-gray-50' : 'text-green-600 hover:bg-green-50'}`}
                      >
                        {game.state === GameState.Active ? <X className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
                        <span>{game.state === GameState.Active ? 'Close' : 'Active'}</span>
                      </button>
                      {(game.state === GameState.Draft || game.state === GameState.InActive) 
                        && <button
                        onClick={() => { onDelete?.(game.id); setOpen(false); }}
                        className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
