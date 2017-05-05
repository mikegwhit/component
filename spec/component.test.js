const {jsdom} = require('jsdom');
const Component = require(__dirname + '/../component.js');

describe('Component', () => {
    beforeEach(() => {

    });

    it('Should load component contents from a file.', (done) => {
        Component.initialize('testComponent', 'spec/testComponent.html')
            .then((contents) => {
                expect(contents.length).toBeGreaterThan(0);
                expect(!!Component.components['testComponent']).toBe(true);
                expect(Component.components['testComponent'].classname)
                    .toBe('Component');
                done();
            });
    });

    it('Should only load component contents once, unless explicitly ' + 
        'requested.', (done) => {
            spyOn($, 'ajax').and.callThrough();
            expect($.ajax.calls.count()).toBe(0);
            Component.initialize('testComponent', 'spec/testComponent.html')
                .then((contents) => {
                    expect($.ajax.calls.count()).toBe(1);
                    Component.initialize('testComponent', 
                        'spec/testComponent.html').then((contents) => {
                            expect($.ajax.calls.count()).toBe(1);
                            done();
                        });
                });

        });

    it('Should allow a Component.load to perform a load of a component ' + 
        'using the configured class.', () => {

        });

    it('Should properly convert component names to element-formatted names',
        () => {

        });

    it('Should allow an HTML string to properly call Component.load with ' + 
        'parameters.', () => {

        });

    it('Should allow a model to be rendered in a template.', () => {

    });

    it('Should allow a component to be rendered with an undefined model or ' + 
        'a model that throws an error.', () => {

    });

    it('Should properly capture invalidation across data types: string, ' + 
        'number, function.', () => {

        });

    it('Should allow subsequent calls of render to render model updates.',
        () => {

        });
    
    it('Should update only parts of the DOM during render that contain ' + 
        'model updates.', () => {

        });

    afterEach(() => {
        Component.components = {};
        Component.numInstances = 0;
        Component.promises = {};
    });
});