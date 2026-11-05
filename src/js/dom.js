import h from './hyperscript.js';

const animTime = 500;
const animFunc = 'ease-in-out';
export const slideYShow = ($node, ms = animTime) => {
  const startingHeight = $node.offsetParent
    ? window.getComputedStyle($node).height
    : '0';
  $node.style.display = 'block';
  $node.style.height = 'auto';
  $node.style.paddingTop = '';
  $node.style.paddingBottom = '';
  $node.style.marginTop = '';
  $node.style.marginBottom = '';
  $node.style.overflow = 'hidden';
  const height = window.getComputedStyle($node).height;
  const heightInt = parseInt(height, 10);
  $node.style.height = startingHeight;
  $node.style.paddingTop = '0';
  $node.style.paddingBottom = '0';
  $node.style.marginTop = '0';
  $node.style.marginBottom = '0';
  if (heightInt > window.innerHeight) {
    ms *= heightInt / window.innerHeight;
  }
  $node.style.transition = `
    height ${ms}ms ${animFunc},
    padding ${ms}ms ${animFunc},
    margin ${ms}ms ${animFunc}
  `;
  setTimeout(() => {
    $node.style.height = height;
    $node.style.paddingTop = '';
    $node.style.paddingBottom = '';
    $node.style.marginTop = '';
    $node.style.marginBottom = '';
  });
  setTimeout(() => {
    if ($node.style.height === height) {
      $node.style.height = '';
      $node.style.overflow = '';
      $node.style.transition = '';
    }
  }, ms);
};

export const slideYHide = ($node, ms = animTime) => {
  $node.style.overflow = 'hidden';
  $node.style.position = 'relative';
  $node.style.paddingTop = '';
  $node.style.paddingBottom = '';
  $node.style.marginTop = '';
  $node.style.marginBottom = '';
  const height = window.getComputedStyle($node).height;
  const heightInt = parseInt(height, 10);
  $node.style.height = height;
  if (heightInt > window.innerHeight) {
    ms *= 1 + (heightInt / window.innerHeight - 1) / 2;
  }
  $node.style.transition = `
    height ${ms}ms ${animFunc},
    padding ${ms}ms ${animFunc},
    margin ${ms}ms ${animFunc}
  `;
  setTimeout(() => {
    $node.style.height = '0';
    $node.style.paddingTop = '0';
    $node.style.paddingBottom = '0';
    $node.style.marginTop = '0';
    $node.style.marginBottom = '0';
    setTimeout(() => {
      if ($node.style.height === '0px' || $node.style.height === '0') {
        $node.style.display = 'none';
      }
    }, ms);
  });
};

export const slideXShow = ($node, ms = animTime) => {
  $node.style.display = '';
  $node.style.width = '';
  $node.style.paddingLeft = '';
  $node.style.paddingRight = '';
  $node.style.marginLeft = '';
  $node.style.marginRight = '';
  const width = window.getComputedStyle($node).width;
  $node.style.width = '0';
  $node.style.paddingLeft = '0';
  $node.style.paddingRight = '0';
  $node.style.marginLeft = '0';
  $node.style.marginRight = '0';
  $node.style.transition = `
    width ${ms}ms ${animFunc},
    padding ${ms}ms ${animFunc},
    margin ${ms}ms ${animFunc}
  `;
  $node.style.overflow = 'hidden';
  $node.style.whiteSpace = 'nowrap';
  setTimeout(() => {
    $node.style.width = width;
    $node.style.paddingLeft = '';
    $node.style.paddingRight = '';
    $node.style.marginLeft = '';
    $node.style.marginRight = '';
  });
};

export const slideXHide = ($node, ms = animTime) => {
  $node.style.width = window.getComputedStyle($node).width;
  $node.style.paddingLeft = '';
  $node.style.paddingRight = '';
  $node.style.marginLeft = '';
  $node.style.marginRight = '';
  $node.style.transition = `
    width ${ms}ms ${animFunc},
    padding ${ms}ms ${animFunc},
    margin ${ms}ms ${animFunc}
  `;
  $node.style.overflow = 'hidden';
  $node.style.whiteSpace = 'nowrap';
  setTimeout(() => {
    $node.style.width = '0';
    $node.style.paddingLeft = '0';
    $node.style.paddingRight = '0';
    $node.style.marginLeft = '0';
    $node.style.marginRight = '0';
    setTimeout(() => {
      $node.style.display = 'none';
    }, ms);
  });
};

const wrapTD = ($td, displayNone = false) => {
  const style = `text-align: inherit;${displayNone ? ' display: none;' : ''}`;
  const $wrapper = h('.row-wrapper', { style });
  $wrapper.append(...$td.childNodes);
  $td.append($wrapper);
  return $wrapper;
};

const unwrapTD = ($td, $wrapper) => {
  $td.append(...$wrapper.childNodes);
  $wrapper.remove();
};

const animateTR = ($tr, displayNone, slideFn, onFinish) => {
  let remainingCells = $tr.children.length;
  for (const $td of $tr.children) {
    const $wrapper = wrapTD($td, displayNone);
    slideFn($wrapper);
    setTimeout(() => {
      unwrapTD($td, $wrapper);
      if (--remainingCells === 0 && onFinish) {
        onFinish();
      }
    }, animTime);
  }
};

export const showTR = ($tr) => {
  $tr.style.display = '';
  animateTR($tr, true, slideYShow);
};

export const hideTR = ($tr, callback) => {
  animateTR($tr, false, slideYHide, () => {
    $tr.style.display = 'none';
    if (callback) {
      callback();
    }
  });
};

export const flashClass = ($node, className, ms) => {
  let timeoutID;
  return () => {
    $node.classList.add(className);
    clearTimeout(timeoutID);
    timeoutID = setTimeout(() => {
      $node.classList.remove(className);
    }, ms);
  };
};
