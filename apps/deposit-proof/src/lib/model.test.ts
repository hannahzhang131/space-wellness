import assert from 'node:assert/strict';
import test from 'node:test';

import {
  canAddPhoto,
  canAddProperty,
  canAddRoom,
  createProperty,
  FREE_PHOTOS_PER_ROOM_VISIT,
  parseLibrary,
  photosFor,
} from './model.ts';

test('free tier allows one home and three photos', () => {
  assert.equal(canAddProperty(0, false), true);
  assert.equal(canAddProperty(1, false), false);
  assert.equal(canAddProperty(4, true), true);
  assert.equal(canAddPhoto(2, false), true);
  assert.equal(canAddPhoto(FREE_PHOTOS_PER_ROOM_VISIT, false), false);
  assert.equal(canAddRoom(false), false);
  assert.equal(canAddRoom(true), true);
});

test('a new home starts with the standard rooms', () => {
  const property = createProperty('Maple', '14 King Street');
  assert.deepEqual(
    property.rooms.map((room) => room.name),
    ['Entrance', 'Living room', 'Kitchen', 'Bedroom', 'Bathroom', 'Hallway'],
  );
  assert.equal(property.rooms.some((room) => room.custom), false);
});

test('photos are counted per room and visit', () => {
  const photos = photosFor(
    [
      {
        id: 'b',
        propertyId: 'home',
        roomId: 'kitchen',
        visit: 'move-out',
        takenAt: '2026-02-01T00:00:00.000Z',
        place: null,
        note: '',
        stored: 'b.jpg',
      },
      {
        id: 'a',
        propertyId: 'home',
        roomId: 'kitchen',
        visit: 'move-in',
        takenAt: '2026-01-02T00:00:00.000Z',
        place: null,
        note: '',
        stored: 'a.jpg',
      },
      {
        id: 'c',
        propertyId: 'home',
        roomId: 'kitchen',
        visit: 'move-in',
        takenAt: '2026-01-01T00:00:00.000Z',
        place: null,
        note: '',
        stored: 'c.jpg',
      },
    ],
    'home',
    'kitchen',
    'move-in',
  );
  assert.deepEqual(
    photos.map((photo) => photo.id),
    ['c', 'a'],
  );
});

test('corrupt libraries are rejected and orphan photos drop', () => {
  assert.equal(parseLibrary({ version: 2 }), null);
  const parsed = parseLibrary({
    version: 1,
    properties: [
      {
        id: 'home',
        name: 'Maple',
        address: '14 King Street',
        createdAt: '2026-01-01T00:00:00.000Z',
        rooms: [{ id: 'kitchen', name: 'Kitchen', custom: false }],
      },
    ],
    photos: [
      {
        id: 'keep',
        propertyId: 'home',
        roomId: 'kitchen',
        visit: 'move-in',
        takenAt: '2026-01-01T00:00:00.000Z',
        place: '14 King Street',
        note: '',
        stored: 'keep.jpg',
      },
      {
        id: 'drop',
        propertyId: 'other',
        roomId: 'kitchen',
        visit: 'move-in',
        takenAt: '2026-01-01T00:00:00.000Z',
        stored: 'drop.jpg',
      },
    ],
  });
  assert.equal(parsed?.photos.length, 1);
  assert.equal(parsed?.photos[0]?.id, 'keep');
});
