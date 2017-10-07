
var FixedColumnLayout = {
    // private
    // returns true if the given position will cause it's
    // child elements will to be positioned relative to it.
    PositionHasStackingContext : function PositionHasStackingContext(position)
    {
        return position == 'relative' ||
               position == 'absolute' ||
               position == 'fixed' ||
               position == 'sticky';
    },
    // private
    GetMissingProperty : function GetMissingProperty(obj, props)
    {
        for(var i = 0; i < props.length; i++)
        {
            if( !(props[i] in obj) )
            {
                return props[i];
            }
        }
        return null;
    },
    // public
    EXTRA_SPACE_TO_XGAP          : 0,
    EXTRA_SPACE_TO_XPADDING      : 1,
    EXTRA_SPACE_TO_XGAP_XPADDING : 2,
    // public
    Layout : function Layout(dom, settings)
    {
        if(!FixedColumnLayout.PositionHasStackingContext(dom.style.position)) {
            alert(' Error: the given DOM to layout has an invalid css position attribute "' +
                dom.style.position + '"');
            return;
        }

        {
            var prop = FixedColumnLayout.GetMissingProperty(settings,
                ["columnWidth", "yPadding", "xPadding", "yGap", "xGap", "extraXSpace"]);
            if(prop != null) {
                alert('Error: settings is missing the "' + prop + '" property');
                return;
            }
        }

        //console.log("dom.offsetWidth=" + dom.offsetWidth + ",  columnWidth =" + settings.columnWidth);

        // calculate column count
        var columnCount = 1;
        var extraXSpace = 0;
        {
            var width = (2 * settings.xPadding) + ( settings.columnWidth);
            if(width < dom.offsetWidth)
            {
                for(;;)
                {
                    var nextWidth = width + settings.xGap + settings.columnWidth;
                    if(nextWidth > dom.offsetWidth)
                    {
                        break;
                    }
                    width = nextWidth;
                    columnCount++;
                }
                extraXSpace = dom.offsetWidth - width;
            }
        }
        //console.log("columnCount=" + columnCount);

        actualXPadding = settings.xPadding;
        actualXGap = settings.xGap;

        if(extraXSpace > 0) {
            if(settings.extraXSpace == FixedColumnLayout.EXTRA_SPACE_TO_XGAP) {
                actualXGap += extraXSpace / (columnCount - 1);
            } else if(settings.extraXSpace == FixedColumnLayout.EXTRA_SPACE_TO_XPADDING) {
                actualXPadding += extraXSpace / 2;
            } else if(settings.extraXSpace == FixedColumnLayout.EXTRA_SPACE_TO_XGAP_XPADDING) {
                actualXGap     += (extraXSpace / 2) / (columnCount - 1);
                actualXPadding += (extraXSpace / 2) / 2;
            } else {
                alert('Error: unknown extraXSpace setting "' + settings.extraXSpace + '"');
                return;
            }
        }

        /*
        // NOTE: I could detect if the column count
        //       has changed, if it hasn't I could
        //       optimize the loop by just changing the
        //       x values...not sure if it's worth it though
        if(dom.hasOwnProperty('columns'))
        {
            console.log("not implemented");
            return;
        }
        */

        dom.columns = [];
        {
            var nextX = actualXPadding;
            for(var i = 0;;) {
                dom.columns.unshift({
                    index: i,
                    nextY:settings.yPadding,
                    x: nextX
                });
                i++;
                if(i >= columnCount) break;
                nextX += settings.columnWidth + actualXGap;
            }
        }

        // start laying out the images
        for(var childIndex = 0; childIndex < dom.childNodes.length; childIndex++)
        {
            var childDom = dom.childNodes[childIndex];
            // only layout DOM nodes
            if(childDom.nodeType == 1)
            {
                FixedColumnLayout.PositionNewChild(dom, settings, childDom);
            }
        }
        FixedColumnLayout.ResizeContainerHeight(dom, settings);
    },
    // private
    ResizeContainerHeight : function ResizeContainerHeight(dom, settings)
    {
        dom.style.height = (dom.columns[0].nextY + settings.yPadding) + 'px';
    },
    // private
    PositionNewChild : function PositionNewChild(dom, settings, childDom)
    {
        var column = dom.columns.pop();

        if(column.nextY > settings.yPadding) {
            column.nextY += settings.yGap;
        }
        childDom.style.position = 'absolute';
        childDom.style.top = (column.nextY) + 'px';
        childDom.style.left = (column.x)+'px';

        // todo: handle min height here
        // todo: could provide a way to calculate the height
        //       for each element
        column.nextY += childDom.offsetHeight;

        // todo: insert the column at the corret sorted position
        for(var i = 0;; i++)
        {
            if(i >= dom.columns.length) {
                dom.columns.push(column);
                break;
            }
            if(column.nextY >= dom.columns[i].nextY) {
                dom.columns.splice(i, 0, column);
                break;
            }
        }
    },
    // public
    AppendNewChild : function AppendNewChild(dom, settings, childDom)
    {
        if( !('columns' in dom) )
        {
            FixedColumnLayout.Layout(dom, settings);
        }
        dom.appendChild(childDom);
        FixedColumnLayout.PositionNewChild(dom, settings, childDom);
        FixedColumnLayout.ResizeContainerHeight(dom, settings);
    }
};
