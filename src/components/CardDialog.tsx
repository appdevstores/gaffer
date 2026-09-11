// Disciplinary cards dialog. Long-press a player (pitch or bench) to open it.
// A 2nd yellow auto-converts to a red; a red sends the player off for the game.

import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useMatch } from '@/state/MatchProvider';
import type { MatchPlayer } from '@/core/types';

interface Props {
  player: MatchPlayer | null;
  onClose: () => void;
}

export default function CardDialog({ player, onClose }: Props) {
  const { giveCard } = useMatch();

  return (
    <Modal visible={player !== null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Card for {player?.playerName ?? ''}</Text>
          <Text style={styles.subtitle}>
            {player
              ? `#${player.jerseyNumber} · ${
                  player.yellowCards > 0
                    ? `${player.yellowCards} yellow${player.yellowCards > 1 ? 's' : ''} shown`
                    : 'no cards yet'
                }`
              : ''}
          </Text>

          {player?.sentOff ? (
            <View style={styles.sentOffBox}>
              <Text style={styles.sentOffText}>🟥 Sent off — cannot play again this game</Text>
            </View>
          ) : (
            <>
              <Pressable
                style={[styles.button, styles.yellowBtn]}
                onPress={() => {
                  giveCard(player!.playerId, 'yellow');
                  onClose();
                }}
              >
                <Text style={styles.buttonText}>
                  {player?.yellowCards === 1 ? '🟨 2nd Yellow → Red' : '🟨 Yellow Card'}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.button, styles.redBtn]}
                onPress={() => {
                  giveCard(player!.playerId, 'red');
                  onClose();
                }}
              >
                <Text style={styles.buttonText}>🟥 Red Card (send off)</Text>
              </Pressable>
            </>
          )}

          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.72)',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 18,
  },
  title: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '900',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 3,
    marginBottom: 14,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 10,
  },
  yellowBtn: {
    backgroundColor: '#ca8a04',
  },
  redBtn: {
    backgroundColor: '#b91c1c',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  sentOffBox: {
    backgroundColor: '#450a0a',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  sentOffText: {
    color: '#fca5a5',
    fontSize: 13,
    fontWeight: '800',
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  cancelText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '700',
  },
});
