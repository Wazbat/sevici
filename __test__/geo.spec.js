const geoService = require('../utils/geo');
describe('Testing the geo service', () => {
    it('returns the expected response format', async () => {
        const result = await geoService.getGeoCodePlace('Torre Sevilla', 'en');
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('coordinates');
    });
    it('returns a valid location', async () => {
        const result = await geoService.getGeoCodePlace('Torre Sevilla', 'en');
        expect(result.coordinates).toHaveProperty('lat');
        expect(result.coordinates).toHaveProperty('lng');
    });
});
