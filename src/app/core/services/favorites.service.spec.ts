import { TestBed } from '@angular/core/testing';
import { FavoritesService } from './favorites.service';

describe('FavoritesService', () => {
  let service: FavoritesService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(FavoritesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should toggle favorites', () => {
    const initialCount = service.favoriteCount();
    const isFav = service.isFavorite('regex-tester');

    service.toggleFavorite('regex-tester');
    expect(service.isFavorite('regex-tester')).toBe(!isFav);

    service.toggleFavorite('regex-tester');
    expect(service.isFavorite('regex-tester')).toBe(isFav);
  });

  it('should clear all favorites', () => {
    service.clearAllFavorites();
    expect(service.favoriteCount()).toBe(0);
    expect(service.favoriteTools().length).toBe(0);
  });
});

