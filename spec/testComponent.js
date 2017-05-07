var Component = require(__dirname + '/../component.js');

class TestComponent extends Component {
    constructor(element, ...args) {
        super(element, 'testComponent', 'spec/testComponent.html');
        this.foo = 'bar';
        this.args = args;
    }
}

module.exports = TestComponent;