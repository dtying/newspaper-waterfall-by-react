require('normalize.css/normalize.css');
require('styles/App.scss');

import React from 'react';
import ReactDOM from 'react-dom';

// let newsUrl = 'https://api.cognitive.microsoft.com/bing/v5.0/news/search';
const newsUrl = 'https://content.guardianapis.com/search';
const apiKey = '87f48fc6-3c38-495b-9421-12f7c2e3da42';

class SearchInput extends React.Component {
  constructor(props) {
    super(props);
  }

  handleInput(e) {
    e.preventDefault();
    this.props.onInput(e.target.value);
  }


  render() {
    return (
      <div className="search-wrapper">
        <input type="text" className="searchBar" value={this.props.searchText} onChange={(e) => this.handleInput(e)}/>
        <input type="button" className="searchBtn" value="Search"
               onClick={() => this.props.onSearch()}/>
      </div>
    );
  }
}

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
      <section className='wrapper' style={styleObj}>
        <section className='news-item'>
          <a href={this.props.value.webUrl}>
            <h2>{this.props.value.webTitle}</h2>
            <div className='thumbnail'>
              <Thumbnail value={this.props.value}/>
            </div>
            <p>{this.props.value.sectionName}</p>
          </a>
        </section>
      </section>
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
      ],
      newsData: [],
      loading: true,
      error: null,
      searchText: ''
    };
    this.page = 1;
    this.searchUrl = newsUrl + '?api-key=' + apiKey + '&page=' + this.page + '&page-size=10';
    this.onInput = this.onInput.bind(this);
    this.onSearch = this.onSearch.bind(this);
    this.loadFromServer = this.loadFromServer.bind(this);
  }

  checkSearch(){
    let trimmedText = this.state.searchText.trim(' ');

    if (!trimmedText){
      this.searchUrl = newsUrl + '?api-key=' + apiKey + '&page=' + this.page + '&page-size=10';
    }else{
      this.searchUrl = newsUrl + '?api-key=' + apiKey + '&page=' + this.page + '&page-size=10'+ '&q=' + trimmedText;
    }
  }

  onInput(text) {
    this.setState({searchText: text});
  }

  onSearch() {
    this.page = 1;
    this.checkSearch();
    this.setState({newsData: [], newsLayoutAry:[]});
    this.loadFromServer(this.searchUrl);
  }

  loadFromServer(url) {
    var getJSON = (url) => {
      var promise = new Promise(function (resolve, reject) {
        var client = new XMLHttpRequest();
        client.open('GET', url);
        client.onreadystatechange = handler;
        client.responseType = 'json';
        client.setRequestHeader('Accept', 'Application/json');
        client.send();

        function handler() {
          if (this.readyState !== 4) {
            return;
          }
          if (this.status === 200) {
            resolve(this.response);
          } else {
            reject(new Error(this.statusText));
          }
        }
      });
      return promise;
    };

    this.setState({loading: true});
    getJSON(url).then(
      json => {
        console.log(url);
        console.log(json);
        let dataNow = this.state.newsData;
        Array.prototype.push.apply(dataNow, json.response.results);
        console.log(dataNow);
        this.setState({newsData: dataNow, loading: false});
        this.page++;
        this.checkSearch();
        this.waterfall();
      },
      error => {
        this.setState({error: error, loading: false});
      }
    )
  }

  waterfall() {
    console.log('9 - waterfall');
    const mainSecDom = ReactDOM.findDOMNode(this.refs.mainSec);
    const screenWidth = mainSecDom.scrollWidth;

    const newsItemDom = ReactDOM.findDOMNode(this.refs.newsItem0);
    const newsItemWidth = newsItemDom.scrollWidth;

    const maxColNum = 5;

    let colNum = Math.floor(screenWidth / newsItemWidth) > maxColNum ? maxColNum : Math.floor(screenWidth / newsItemWidth);

    let heightAry = [], newsLayoutAry = this.state.newsLayoutAry;

    for (let i = 0, len = this.state.newsData.length; i < len; i++) {
      let itemDom = ReactDOM.findDOMNode(this.refs['newsItem' + i]);
      let itemHeight = itemDom.scrollHeight;

      //for 1st row initialize heightAry
      if (i < colNum) {
        heightAry.push(itemHeight);
        newsLayoutAry[i] = {
          pos: {
            left: i * newsItemWidth,
            top: 0
          }
        };
      } else {
        //from 2nd row find the current min height and add to the min height
        let min = Math.min.apply(null, heightAry);
        let minIndex = heightAry.indexOf(min);

        newsLayoutAry[i] = {
          pos: {
            left: minIndex * newsItemWidth,
            top: min
          }
        };

        heightAry[minIndex] += itemHeight;
      }
    }

    this.setState(newsLayoutAry);
  }

  checkScroll() {
    let lastRef = 'newsItem' + (this.state.newsLayoutAry.length - 1);
    let lastItem = ReactDOM.findDOMNode(this.refs[lastRef]);
    let lastItemHeight = lastItem.offsetTop + Math.floor(lastItem.offsetHeight / 4);
    let scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    let documentH = document.documentElement.clientHeight;
    return (lastItemHeight < scrollTop + documentH);
  }

  onScroll() {
    if (this.checkScroll()) {
      this.loadFromServer(this.searchUrl);
    }
  }

  throttle() {
    const wait = 4500;
    let previous = 0;
    let timeout;

    return () => {
      let now = Date.now();
      let remaining = wait - (now - previous);

      if (remaining <= 0) {

        if (timeout) {
          clearTimeout(timeout);
        }
        previous = now;
        timeout = null;
        this.onScroll.bind(this)();
      } else if (!timeout) {
        timeout = setTimeout(this.onScroll.bind(this), remaining);
      }
    };
  }


  componentDidMount() {
    console.log('2 - componentDidMount');

    //initial server request
    this.loadFromServer(this.searchUrl);

    window.addEventListener('scroll', this.throttle(), false);
  }

  render() {
/*    if (this.state.loading) {
      console.log('1 - Loading now');
      return <span>Loading now</span>;
    }*/

    if (this.state.error !== null) {
      return <span>Error: {this.state.error.message}</span>;
    }

    else {
      let navItems = [];
      let newsItems = [];
      console.log('4 - render start');

      this.state.newsData.forEach(function (value, index) {

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
            <SearchInput searchText={this.state.searchText} onInput={this.onInput} onSearch={this.onSearch}/>
          </nav>
          <section className="main-sec" ref={'mainSec'}>
            {newsItems}
          </section>
        </section>
      );
    }
  }
}

AppComponent.defaultProps = {};

export default AppComponent;
