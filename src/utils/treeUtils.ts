import * as React from 'react';
import _ from 'lodash';
import { reactToString, shallowEqual, shallowEqualArray } from 'rsuite-utils/lib/utils';
import { Node } from '../CheckTreePicker/utils';
import { TREE_NODE_DRAG_TYPE } from '../constants';
import { TreePickerProps } from '../TreePicker/TreePicker.d';
import { CheckTreePickerProps } from '../CheckTreePicker/CheckTreePicker.d';

const SEARCH_BAR_HEIGHT = 48;
const MENU_PADDING = 12;
// Tree Node 之间的 间隔
const TREE_NODE_GAP = 8;

/**
 * 判断当前节点是否应该显示
 * @param {*} expandItemValues
 * @param {*} parentKeys
 */
export function shouldShowNodeByExpanded(expandItemValues: any[] = [], parentKeys: any[] = []) {
  const intersectionKeys = _.intersection(expandItemValues, parentKeys);
  if (intersectionKeys.length === parentKeys.length) {
    return true;
  }
  return false;
}

/**
 * 拍平树结构为数组
 * @param {*} tree
 * @param {*} childrenKey
 * @param {*} executor
 */
export function flattenTree(
  tree: any[],
  childrenKey = 'children',
  executor?: (node: object, index: number) => object
) {
  const flattenData: any[] = [];
  const traverse = (data: any[], parent: object | null) => {
    if (!_.isArray(data)) {
      return;
    }

    data.forEach((item: any, index: number) => {
      const node: any = typeof executor === 'function' ? executor(item, index) : item;
      node.parent = parent;

      flattenData.push({ ...node });

      if (item[childrenKey]) {
        traverse(item[childrenKey], item);
      }
    });
  };

  traverse(tree, null);
  return flattenData;
}

/**
 * 获取树节点所有的祖先节点
 * @param {*} node
 */
export function getNodeParents(node: object, parentKey = 'parent', valueKey?: string) {
  const parents: any[] = [];
  const traverse = (node: any) => {
    if (node?.[parentKey]) {
      traverse(node[parentKey]);

      if (valueKey) {
        parents.push(node[parentKey][valueKey]);
      } else {
        parents.push(node[parentKey]);
      }
    }
  };

  traverse(node);

  return parents;
}

/**
 * 判断当前节点是否显示
 * @param {*} label
 * @param {*} searchKeyword
 */
export function shouldDisplay(label: any, searchKeyword: string) {
  if (!_.trim(searchKeyword)) {
    return true;
  }
  const keyword = searchKeyword.toLocaleLowerCase();
  if (typeof label === 'string') {
    return label.toLocaleLowerCase().indexOf(keyword) >= 0;
  } else if (React.isValidElement(label)) {
    const nodes = reactToString(label);
    return (
      nodes
        .join('')
        .toLocaleLowerCase()
        .indexOf(keyword) >= 0
    );
  }
  return false;
}

/**
 * 获取 VirtualList 的高度
 * @param {*} inline
 * @param {*} height
 */
export function getVirtualLisHeight(inline: boolean, searchable: boolean, height = 0) {
  const searchBarHeight = searchable ? SEARCH_BAR_HEIGHT : 0;
  return inline ? height - MENU_PADDING * 2 : height - searchBarHeight - MENU_PADDING * 2;
}

/**
 * 判断节点是否存在可见的子节点。
 * @param node
 */
export function hasVisibleChildren(node: Node, childrenKey: string) {
  if (!Array.isArray(node[childrenKey])) {
    return false;
  }

  return node[childrenKey].some((child: Node) => child.visible);
}

/**
 * 废弃 prop warning
 * @param prop
 */
export function treeDeprecatedWarning(
  props: CheckTreePickerProps | TreePickerProps,
  keys: string[] = []
) {
  keys.forEach(key => {
    if (!_.isUndefined(props[key])) {
      console.warn(`'Warning: ${key} is deprecated and will be removed in a future release.'`);
    }
  });
}

/**
 * 浅比较两个数组是否不一样
 * @param a
 * @param b
 */
export function compareArray(a: any[], b: any[]) {
  return _.isArray(a) && _.isArray(b) && !shallowEqualArray(a, b);
}

/**
 * 获取 expandAll 的 value
 * @param props
 */
export function getExpandAll(props: TreePickerProps | CheckTreePickerProps) {
  const { expandAll, defaultExpandAll } = props;
  return !_.isUndefined(expandAll) ? expandAll : defaultExpandAll;
}

/**
 * 获取 expandItemValues 的 value
 * @param props
 */
export function getExpandItemValues(props: TreePickerProps | CheckTreePickerProps) {
  const { expandItemValues, defaultExpandItemValues } = props;
  if (!_.isUndefined(expandItemValues) && Array.isArray(expandItemValues)) {
    return expandItemValues;
  }

  if (!_.isUndefined(defaultExpandItemValues) && Array.isArray(defaultExpandItemValues)) {
    return defaultExpandItemValues;
  }
  return [];
}

/**
 * 获取节点展开状态
 * @param node
 * @param props
 */
export function getExpandState(node: any, props: CheckTreePickerProps | TreePickerProps) {
  const { valueKey, childrenKey, expandItemValues } = props;

  const expandAll = getExpandAll(props);
  const expand = getExpandItemValues(props).some((value: any) =>
    shallowEqual(node[valueKey], value)
  );
  if (!_.isUndefined(expandItemValues)) {
    return expand;
  } else if (node[childrenKey]?.length) {
    if (!_.isNil(node.expand)) {
      return !!node.expand;
    } else if (expandAll) {
      return true;
    }
    return false;
  }
  return false;
}

/**
 * 获取拖拽节点及子节点的key
 * @param node
 * @param childrenKey
 * @param valueKey
 */
export function getDragNodeKeys(dragNode: any, childrenKey: string, valueKey: string) {
  let dragNodeKeys: any[] = [dragNode[valueKey]];
  const traverse = (data: any) => {
    if (data?.length > 0) {
      data.forEach((node: any) => {
        dragNodeKeys = dragNodeKeys.concat([node[valueKey]]);
        if (node[childrenKey]) {
          traverse(node[childrenKey]);
        }
      });
    }
  };

  traverse(dragNode[childrenKey]);

  return dragNodeKeys;
}

export function calDropNodePosition(event: React.MouseEvent, treeNodeElement: Element) {
  const { clientY } = event;
  const { top, bottom } = treeNodeElement.getBoundingClientRect();
  // console.log(`bottom + gap:${bottom + TREE_NODE_GAP}, clientY:${clientY}`);
  console.log(`bottom :${bottom}, top: ${top}, clientY:${clientY}`);
  // console.log(`top - gap:${top - TREE_NODE_GAP},  clientY:${clientY}`);
  const gap = TREE_NODE_GAP;

  // 处于节点下方
  if (clientY >= bottom - gap) {
    return TREE_NODE_DRAG_TYPE.DRAG_OVER_BOTTOM;
  }

  // 处于节点上方
  if (clientY < top + gap) {
    return TREE_NODE_DRAG_TYPE.DRAG_OVER_TOP;
  }

  return TREE_NODE_DRAG_TYPE.DRAG_OVER;
}
