require('normalize.css/normalize.css');
require('styles/App.scss');

import React from 'react';
import ReactDOM from 'react-dom';

let newsData = require('../data/newsData.json').value;

class Thumbnail extends React.Component {
  render() {
    let isImage = this.props.value.image;

    if (isImage) {
      return <img src={isImage.thumbnail.contentUrl}/>;
    } else {
      return (
        <p>image holder</p>
      );
    }
  }
}

class NewsItem extends React.Component {
  render() {
    let styleObj = {};

    if (this.props.layout.pos) {
      styleObj = this.props.layout.pos;
    }

    return (
      <div className="wrapper" style={styleObj}>
        <section className="news-item">
          <a href={this.props.value.url}>
            <h2>{this.props.value.name}</h2>
            <div className="thumbnail">
              <Thumbnail value={this.props.value}/>
            </div>
            <p>{this.props.value.description}</p>
          </a>
        </section>
      </div>
    );
  }
}


class AppComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state =
    {
      newsLayoutAry: [
        /*{
         pos:{
         left: 0,
         top: 0}
         }*/
      ]
    };
  }

  waterfall(colNum, itemWidth) {
    let heightAry = [], newsLayoutAry = this.state.newsLayoutAry;

    for (let i = 0, len = newsData.length; i < len; i++) {
      let itemDom = ReactDOM.findDOMNode(this.refs['newsItem' + i]);
      let itemHeight = itemDom.scrollHeight;

      //for 1st row initialize heightAry
      if (i < colNum) {
        heightAry.push(itemHeight);
        newsLayoutAry[i] = {
          pos: {
            left: i * itemWidth,
            top: 0
          }
        };
      } else {
        //from 2nd row find the current min height and add to the min height
        let min = Math.min.apply(null, heightAry);
        let minIndex = heightAry.indexOf(min);

        newsLayoutAry[i] = {
          pos: {
            left: minIndex * itemWidth,
            top: min
          }
        };

        heightAry[minIndex] += itemHeight;
      }
    }
    this.setState(newsLayoutAry);
  }

  componentDidMount() {
    let mainSecDom = ReactDOM.findDOMNode(this.refs.mainSec);
    const screenWidth = mainSecDom.scrollWidth;

    let newsItemDom = ReactDOM.findDOMNode(this.refs.newsItem0);
    const newsItemWidth = newsItemDom.scrollWidth;

    const maxColNum = 5;

    let colNum = Math.floor(screenWidth / newsItemWidth) > maxColNum ? maxColNum : Math.floor(screenWidth / newsItemWidth);

    this.waterfall(colNum, newsItemWidth);
  }

  render() {
    let navItems = [], newsItems = [];

    newsData.forEach(function (value, index) {

      if (!this.state.newsLayoutAry[index]) {
        this.state.newsLayoutAry[index] = {
          pos: {
            left: 0,
            top: 0
          }
        };
      }

      newsItems.push(<NewsItem value={value} key={index} ref={'newsItem'+index}
                               layout={this.state.newsLayoutAry[index]}/>);
    }.bind(this));

    return (
      <section>
        <nav className="nav">
          {navItems}
        </nav>
        <section className="main-sec" ref="mainSec">
          {newsItems}
        </section>
      </section>
    );
  }
}

AppComponent.defaultProps = {};

export default AppComponent;
