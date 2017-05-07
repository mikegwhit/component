const {JSDOM} = require('jsdom');
const dom = new JSDOM(require('fs').readFileSync(__dirname + '/testPage.html', 
    'UTF8'));
const document = dom.window.document;    
const Component = require(__dirname + '/../component.js');
const setDocument = require(__dirname + '/../component.js').setDocument;

describe('Component', () => {
    beforeEach(() => {
        setDocument(document);
    });

    it('Should load component contents from a file.', (done) => {
        Component.initialize('testComponent', 'spec/testComponent.html')
            .then((prototype) => {
                expect(prototype.contents.length).toBeGreaterThan(0);
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
                .then((prototype) => {
                    expect($.ajax.calls.count()).toBe(1);
                    Component.initialize('testComponent', 
                        'spec/testComponent.html').then((prototype) => {
                            expect($.ajax.calls.count()).toBe(1);
                            done();
                        });
                });
        });

    it('Should allow a Component.instance to perform a instance of a ' + 
        'component using the configured class.', (done) => {
            var TestComponent = require(__dirname + '/testComponent.js');
            Component.initialize('testComponent', 'spec/testComponent.html',
                TestComponent)
                .then((prototype) => {
                    Component.instance(document.getElementById('container'), 
                        'testComponent').then((instance) => {
                            expect(document.querySelectorAll('test-component')
                                .length).toBe(1);
                            // Fails unless TestComponent is instantiated...
                            expect(instance.foo).toBe('bar');
                            done();
                        });
                });
        });

    it('Should properly convert component names to element-formatted names',
        () => {
            expect(Component.toElementName('todoList')).toBe('todo-list');
            expect(Component.toElementName('fooHTTP')).toBe('foo-http');
            // not pretty, but better than fooHTTPbar -> foo-http-bar
            // and HTMLParser -> htmlp-arser
            expect(Component.toElementName('fooHTTPbar')).toBe('foo-httpbar');
            expect(Component.toElementName('HTMLParser')).toBe('htmlparser');
        });

    it('Should allow an HTML string to properly call Component.load with ' + 
        'parameters.', (done) => {
            var TestComponent = require(__dirname + '/testComponent.js');
            Component.initialize('testComponent', 'spec/testComponent.html',
                TestComponent)
                .then((prototype) => {
                    Component.instance(document.getElementById('container'), 
                        'testComponent', 1, 2, 3).then((instance) => {
                            expect(instance.args.length).toBe(3);
                            expect(instance.args[0]).toBe(1);
                            done();
                        });
                });
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

    it('When a component instnace is removed, it should also properly ' +
        'decrement all counters and remove references.', () => {

        });

    afterEach(() => {
        Component.components = {};
        Component.numInstances = 0;
        Component.promises = {};
    });
});