import {
  VRow, VCol, VTextField, VTextarea,
} from 'vuetify/lib/components';

export default {
  text: { component: VTextField },
  textArea: { component: VTextarea },
  row: {
    component: VRow,
    childResolver: (child) => {
      const { props: childProps = {} } = child;
      const allProps = ['align-self', 'cols', 'lg', 'md', 'offset', 'offset-lg', 'offset-md', 'offset-sm', 'offset-xl', 'order', 'order-lg', 'order-md', 'order-sm', 'order-xl', 'sm', 'xl'];
      const keys = Object.keys(childProps).filter((key) => allProps.includes(key));
      const props = Object.assign({ cols: 12 }, ...keys.map((key) => ({ [key]: childProps[key] })));

      return {
        component: VCol,
        type: 'col',
        props,
        children: [child],
      };
    },
  },
};