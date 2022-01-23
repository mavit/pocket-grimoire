/**
 * An abstract class designed for working with the token data. This class has
 * magic methods, starting with "get", that access information from the data.
 * @abstract
 */
export default class Token {

    /**
     * Helper function that converts a property into a data key. For example,
     * "getLoremIpsum" is converted into "loremIpsum".
     *
     * @param  {String} property
     *         Property to convert.
     * @return {String}
     *         Converted property.
     */
    static convertProperty(property) {

        const clipped = property.replace(/^get/, "");

        return clipped.charAt(0).toLowerCase() + clipped.slice(1);

    }

    /**
     * @param {Object} data
     *        Data to access.
     */
    constructor(data) {

        /**
         * The data to access.
         * @type {Object}
         */
        this.data = data;

        const constructor = this.constructor;

        return new Proxy(this, {

            get(target, property) {

                if (!(property in target) && property.startsWith("get")) {

                    target[property] = () => target.getData(
                        constructor.convertProperty(property)
                    );

                }

                return target[property];

            }

        });

    }

    /**
     * Creates a new instance of {@link Token} with the same data.
     *
     * @return {Token}
     *         A cloned instance.
     */
    clone() {
        return new this.constructor(this.data);
    }

    /**
     * Gets the key from {@link Template#data} and returns the value.
     *
     * @param  {String} key
     *         Key for the data to access.
     * @return {?}
     *         Corresponding data.
     * @throws {ReferenceError}
     *         The given key must exist in {@link Token#data}.
     */
    getData(key) {

        if (!Object.prototype.hasOwnProperty.call(this.data, key)) {
            throw new ReferenceError(`Unrecognised property "${key}"`);
        }

        return this.data[key];

    }

}
