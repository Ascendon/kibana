define(function (require) {
  var _ = require('lodash');
  var fixtures = require('fixtures/fake_hierarchial_data');

  var AggConfigs;
  var Vis;
  var indexPattern;
  var buildHierarchialData;

  describe('buildHierarchialData()', function () {

    beforeEach(module('kibana'));
    beforeEach(inject(function (Private) {
      Vis = Private(require('components/vis/vis'));
      AggConfigs = Private(require('components/vis/_agg_configs'));
      indexPattern = Private(require('fixtures/stubbed_logstash_index_pattern'));
      buildHierarchialData = Private(require('components/visualize/_build_hierarchial_data'));
    }));


    describe('metric only', function () {
      var vis, results;

      beforeEach(function () {
        var id = 1;
        vis = new Vis(indexPattern, {
          type: 'pie',
          aggs: [
            { type: 'avg', schema: 'metric', params: { field: 'bytes' } },
          ]
        });
        vis.aggs[0].id = 'agg_1';
        results = buildHierarchialData(vis, fixtures.metricOnly);

      });

      it('should set the slices with one children with the name _all', function () {
        expect(results).to.have.property('slices');
        expect(results.slices).to.have.property('children');
        expect(results.slices.children).to.have.length(1);
        expect(results.slices.children[0]).to.have.property('name', '_all');
        expect(results.slices.children[0]).to.have.property('size', 412032);
        expect(results).to.have.property('names');
        expect(results.names).to.eql(['_all']);
        expect(results).to.have.property('raw');
        expect(results.raw).to.have.property('rows');
        expect(results.raw.rows).to.have.length(1);
        expect(results.raw.rows).to.eql([[412032]]);
      });

    });

    describe('threeTermBuckets', function () {
      var vis, results;

      beforeEach(function () {
        var id = 1;
        vis = new Vis(indexPattern, {
          type: 'pie',
          aggs: [
            { type: 'avg', schema: 'metric', params: { field: 'bytes' } },
            { type: 'terms', schema: 'split', params: { field: 'extension' }},
            { type: 'terms', schema: 'segment', params: { field: 'machine.os' }},
            { type: 'terms', schema: 'segment', params: { field: 'geo.src' }}
          ]
        });
        // We need to set the aggs to a known value.
        _.each(vis.aggs, function (agg) { agg.id = 'agg_' + id++; });
        results = buildHierarchialData(vis, fixtures.threeTermBuckets);
      });

      it('should set the hits attribute for the results', function () {
        expect(results).to.have.property('rows');
        _.each(results.rows, function (item) {
          expect(item).to.have.property('names');
          expect(item).to.have.property('slices');
          expect(item.slices).to.have.property('children');
        });
        expect(results).to.have.property('raw');
      });


    });

    describe('oneHistogramBucket', function () {
      var vis, results;

      beforeEach(function () {
        var id = 1;
        vis = new Vis(indexPattern, {
          type: 'pie',
          aggs: [
            {
              type: 'count',
              schema: 'metric'
            },
            { type: 'histogram', schema: 'segment', params: { field: 'bytes', interval: 8192 }}
          ]
        });
        // We need to set the aggs to a known value.
        _.each(vis.aggs, function (agg) { agg.id = 'agg_' + id++; });
        results = buildHierarchialData(vis, fixtures.oneHistogramBucket);
      });

      it('should set the hits attribute for the results', function () {
        expect(results).to.have.property('slices');
        expect(results.slices).to.property('children');
        expect(results).to.have.property('names');
        expect(results.names).to.have.length(6);
        expect(results).to.have.property('raw');
      });


    });

    describe('oneRangeBucket', function () {
      var vis, results;

      beforeEach(function () {
        var id = 1;
        vis = new Vis(indexPattern, {
          type: 'pie',
          aggs: [
            {
              type: 'count',
              schema: 'metric'
            },
            {
              type: 'range',
              schema: 'segment',
              params: {
                field: 'bytes',
                ranges: [
                  { from: 0, to: 1000 },
                  { from: 1000, to: 2000 }
                ]
              }
            }
          ]
        });
        // We need to set the aggs to a known value.
        _.each(vis.aggs, function (agg) { agg.id = 'agg_' + id++; });
        results = buildHierarchialData(vis, fixtures.oneRangeBucket);
      });

      it('should set the hits attribute for the results', function () {
        expect(results).to.have.property('slices');
        expect(results.slices).to.property('children');
        expect(results).to.have.property('names');
        expect(results.names).to.have.length(2);
        expect(results).to.have.property('raw');
      });

    });

    describe('oneFilterBucket', function () {
      var vis, results;

      beforeEach(function () {
        var id = 1;
        vis = new Vis(indexPattern, {
          type: 'pie',
          aggs: [
            { type: 'count', schema: 'metric' },
            { type: 'filters', schema: 'segment', params: {
                filters: [
                  { input: { query: { query_string: { query: '_type:apache' } } } },
                  { input: { query: { query_string: { query: '_type:nginx' } } } }
                ]
              }
            }
            ]
          });
        // We need to set the aggs to a known value.
        _.each(vis.aggs, function (agg) { agg.id = 'agg_' + id++; });
        results = buildHierarchialData(vis, fixtures.oneFilterBucket);
      });

      it('should set the hits attribute for the results', function () {
        expect(results).to.have.property('slices');
        expect(results).to.have.property('names');
        expect(results.names).to.have.length(2);
        expect(results).to.have.property('raw');
      });

    });

  });
});

