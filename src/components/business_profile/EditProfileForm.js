/** Class representing a point. */
import { Form, Modal, Input, DatePicker, Tooltip, Button, Icon, message } from 'antd';
import React from 'react';
import * as mutations from '../../graphql/mutations';
import { API, graphqlOperation, Auth, I18n } from "aws-amplify";
import moment from 'moment';

const FormItem = Form.Item;

/**
 * Edit Business Profile Form
 */
class ModalForm extends React.Component {
  /**
   * @param {object} props - props from the BusinessPage component
   */
  constructor(props) {
    
    super(props);

    let data = this.props.data;
    let {visible,jobList,companyAddress,companyPic,value,allowEdit,jobAmount,...newData} 
        = this.props.data;

    this.state = { ...newData };
     /**
     * a string that represents the first part of the street address
     * @name ModalForm#type
     * @type String
     */
    this.state.addressLine1 = data.companyAddress.addressLine1;
    /**
     * a string that represents the second part of the street address
     * @name ModalForm#type
     * @type String
     */
    this.state.addressLine2 = data.companyAddress.addressLine2;
        /**
     * a string that represents the second part of the city of address
     * @name ModalForm#type
     * @type String
     */
    this.state.city = data.companyAddress.city;
        /**
     * a string that represents the second part of the postal code of address
     * @name ModalForm#type
     * @type String
     */
    this.state.postalCode = data.companyAddress.postalCode;
        /**
     * a string that represents the second part of the state of address
     * @name ModalForm#type
     * @type String
     */
    this.state.state = data.companyAddress.state;
        /**
     * a string that represents address ID from the dynamoDB
     * @name ModalForm#type
     * @type String
     */
    this.state.addressID = data.companyAddress.id;
        /**
     * a string that represents how many timelines events
     * @name ModalForm#type
     * @type String
     */
    this.state.originalTimeline = data.timeline;
    this.state.timelineNum = data.timeline.length;
        /**
     * a string that indicates if the timeline change, it has false as default value
     * and it will change to true if any timeline event change triggers
     * @name ModalForm#type
     * @type String
     */
    this.state.isTimelineChange= false;
            /**
     * a string that indicates if the address change, it has false as default value
     * and it will change to true if any address event change triggers
     * @name ModalForm#type
     * @type String
     */
    this.state.isAddressChange= false;
  }
  
  /**
   * update the state when props change
   * @param {number} nextProps - next coming props
   */
  componentWillReceiveProps = (nextProps) => {
    let data = nextProps.data;
    let {visible,jobList,companyAddress,companyPic,value,allowEdit,jobAmount,...newData} 
        = this.props.data;
    console.log("new data", newData);
    
    this.setState({ ...newData });
    this.setState({ addressLine1: data.companyAddress.addressLine1 });
    this.setState({ addressLine2: data.companyAddress.addressLine2 });
    this.setState({ city: data.companyAddress.city});
    this.setState({ postalCode: data.companyAddress.postalCode });
    this.setState({ state: data.companyAddress.state });
    this.setState({ addressID: data.companyAddress.id });
    this.setState({ lan: window.localStorage.getItem('lan') });
    this.setState({timelineNum : data.timeline.length});
    this.setState({originalTimeline : data.timeline});
  }

    /**
   * @param {object} event - change the state if any input change
   */
  handleUpdate = (event) => {
    let name = event.target.name;
    let value = event.target.value;
    value = value === "" ? null : value;
    if(name === "addressLine1" || name === "addressLine2" || name === "city" ||
      name === "postalCode" || name=== "state")
      this.setState({isAddressChange:true})
    this.setState({
      [event.target.name]: value
    })
  }

  /**
   * update timeline on dynamodb,add delete or update
   */
  updateTimeline = async ()=>{
    let newLength = this.state.timeline.length;
    let originalLen = this.state.timelineNum;
    let timelines = this.state.timeline;

    //update events
    let updateNum = originalLen < newLength? originalLen : newLength;
    for(let index = 0; index < updateNum; index++){
      let timelineData = timelines[index]
      timelineData.timelineCompanyId = this.state.companyID;
      let timeline = await API.graphql(graphqlOperation(mutations.updateTimeline,
        {input: timelineData}));
    }
    
    //create new event
    if(originalLen < newLength){
      for(let index = originalLen; index < newLength; index++){
        let timelineData =timelines[index];
        timelineData.timelineCompanyId = this.state.companyID;
        let timeline = await API.graphql(graphqlOperation(mutations.createTimeline,
          {input: timelineData}));
      }
    }
    //delete extra event
    else if(originalLen > newLength){
      for(let index = newLength; index < originalLen; index++){
        let timelineData= {};
        timelineData.id = this.state.originalTimeline[index].id;
        let timeline = await API.graphql(graphqlOperation(mutations.deleteTimeline,
          {input: timelineData}));
      }
    }
  }
  
  /**
   * handel submit event after click submit, if success, it will pop up "successfully update"
   * otherwise, it will shows "update fail"
   */
  handleSubmit = async () => {
    try{
        //update basic employer information
        let employerData = {
          id: this.state.companyID,
          companyName: this.state.companyName,
          companyEmail: this.state.companyEmail,
          companyPhone: this.state.companyPhone,
          companyWebsite: this.state.companyWebsite,
          companyPic: this.state.companyPic,
          revenue: this.state.revenue,
          ceo: this.state.ceo,
          ceoPic: this.state.ceoPic,
          videoURL:this.state.videoURL,
          companyType: this.state.companyType,
          description: this.state.description,
          headquarter: this.state.headquarter,
          size: this.state.size
        }
        let newEmployer = await API.graphql(graphqlOperation(mutations.updateEmployer,
          { input: employerData }));
        console.log("upload new profile", newEmployer);

        //update address if any changed
        if(this.state.isAddressChange){
          let addressData = {
            id: this.state.addressID,
            line1: this.state.addressLine1,
            line2: this.state.addressLine2,
            city:this.state.city,
            postalCode: this.state.postalCode,
            state: this.state.state
          }
          let newAddress = await API.graphql(graphqlOperation(mutations.updateAddress,
            { input: addressData }));
          console.log("upload new address", newAddress);
        }

        //update timelines if any changed
        if(this.state.isTimelineChange)
          this.updateTimeline();    
        this.props.onOk();
        message.success(`Profile Update Successfully`);
    }
    catch(err){
        this.props.onOk();
        console.log(err.errors[0].message);
        message.error(`Profile Update Fail`);
    }
  }

  /**
   * insert one more timeline event on this.state at the end of the timeline list
   */
  handleAddTimeline = () => {
    let timelines = this.state.timeline;
    let newTimeline = {
      info: null,
      title: null,
      date: moment(new Date(), "YYYY-MM-DD")
    }
    timelines = [...timelines, newTimeline];
    this.setState({ timeline: timelines,isTimelineChange:true });
  }

  /**
   * 
   * delet one timeline event on this.state based on index
   */
  handleDeleteTimeline = (index) => {
    let timelines = [...this.state.timeline];
    timelines.splice(index, 1);
    this.setState({ timeline: timelines,isTimelineChange:true });
  }

  /**
   *
   * update the state when event title change
   */
  handleTitleUpdate = (e, index) => {
    let timelines = [...this.state.timeline];
    let changeTimeline = timelines[index];
    changeTimeline.title = e.target.value === ""? null : e.target.value;
    this.setState({ timeline: timelines });
    this.setState({ timeline: timelines, isTimelineChange:true });
  }

  /**
   * update the state when timeline date change
   */
  handleDateUpdate = (dateString, index) => {
    let timelines = [...this.state.timeline];
    let changeTimeline = timelines[index];
    changeTimeline.date = dateString === "" ? null : dateString;
    this.setState({ timeline: timelines,isTimelineChange:true });
  }

  /**
   * update the state when description change
   *  */
  handleInfoUpdate = (e,index) => {
    let timelines = [...this.state.timeline];
    let changeTimeline = timelines[index];
    changeTimeline.info = e.target.value === "" ? null : e.target.value;
    this.setState({ timeline: timelines,isTimelineChange:true });
  }


  render() {

    const formItemLayout = {
      labelCol: {
        xs: { span: 24 },
        sm: { span: 8 },
      },
      wrapperCol: {
        xs: { span: 24 },
        sm: { span: 16 },
      }
    };
       
    return (
      <Modal
        title={I18n.get("Edit Company Information")}
        okText={I18n.get("Save")}
        cancelText={I18n.get("Cancel")}
        visible={this.props.visible}
        onOk={this.handleSubmit}
        onCancel={this.props.onCancel}
        width={800}
      >
        <Form 
          className="login-form">
          <br />
          <h2 style={{ marginLeft: "15%" }}>{I18n.get('Base Information')}:</h2>
          <FormItem
            {...formItemLayout}
            label={I18n.get("Company Name")}
          >
            <Input
              value={this.state.companyName}
              style={{ width: "60%" }}
              name="companyName"
              onChange={(event) => { this.handleUpdate(event) }}
              />
          </FormItem>
          <FormItem
            {...formItemLayout}
            label={I18n.get("Website")}
          >
            <Input
              value={this.state.companyWebsite}
              name="companyWebsite"
              style={{ width: "60%" }}
              onChange={(event) => { this.handleUpdate(event) }}
              />
          </FormItem>
          <FormItem
            {...formItemLayout}
            label={I18n.get("Company Type")}
          >
            <Input
              value={this.state.companyType}
              style={{ width: "60%" }}
              name="companyType"
              onChange={(event) => { this.handleUpdate(event) }}
              />
          </FormItem>

          <FormItem
            {...formItemLayout}
            label={I18n.get("Company Email")}
          >
            <Input
              value={this.state.companyEmail}
              style={{ width: "60%" }}
              name="companyEmail"
              onChange={(event) => { this.handleUpdate(event) }}
              />
          </FormItem>

          <FormItem
            {...formItemLayout}
            label={I18n.get("Company Phone")}
          >
            <Input
              value={this.state.companyPhone}
              style={{ width: "60%" }}
              name="companyPhone"
              onChange={(event) => { this.handleUpdate(event) }}
              />
          </FormItem>

          <Form.Item
            {...formItemLayout}
            label={I18n.get("Description")}
          >
            <Input.TextArea
              value={this.state.description}
              style={{ width: "70%" }}
              rows={6}
              name="description"
              onChange={(event) => { this.handleUpdate(event) }}
              placeholder="description" />
          </Form.Item>
          <h2 style={{ marginLeft: "15%" }}>{I18n.get("Details")}:</h2>
          <FormItem
            {...formItemLayout}
            label={I18n.get("Headquarters")}
          >
            <Input
              value={this.state.headquarter}
              style={{ width: "60%" }}
              name="headquarter"
              onChange={(event) => { this.handleUpdate(event) }}
              />
          </FormItem>
          <FormItem
            {...formItemLayout}
            label={I18n.get("Size")}
          >
            <Input
              value={this.state.size}
              type = "number"
              style={{ width: "60%" }}
              name="size"
              onChange={(event) => { this.handleUpdate(event) }}
              />
          </FormItem>
          <FormItem
            {...formItemLayout}
            label={I18n.get("Revenue")}
          >
            <Input
              value={this.state.revenue}
              style={{ width: "60%" }}
              type = "number"
              name="revenue"
              onChange={(event) => { this.handleUpdate(event) }}
               />
          </FormItem>
          <FormItem
            {...formItemLayout}
            label={I18n.get("CEO name")}
          >
            <Input
              value={this.state.ceo}
              name="ceo"
              onChange={(event) => { this.handleUpdate(event) }}
              style={{ width: "60%" }}
              />
          </FormItem>
          <FormItem
            {...formItemLayout}
            label={I18n.get("CEO Picture")}
          >
            <Input
              value={this.state.ceoPic}
              style={{ width: "60%" }}
              name="ceoPic"
              onChange={(event) => { this.handleUpdate(event) }}
              />
          </FormItem>
          <FormItem
            {...formItemLayout}
            label={I18n.get("YouTube Video")}
          >
            <Input
              value={this.state.videoURL}
              style={{ width: "60%" }}
              name="videoURL"
              onChange={(event) => { this.handleUpdate(event) }}
              suffix={
                <Tooltip title="Must be a Youtube Embled Link">
                  <Icon type="info-circle" style={{ color: 'rgba(0,0,0,.45)' }} />
                </Tooltip>
              }
              
              />
          </FormItem>

          <h2 style={{ marginLeft: "15%" }}>{I18n.get('Address')}:</h2>
          <FormItem
            {...formItemLayout}
            label={I18n.get("Address Line 1")}
          >
            <Input
              value={this.state.addressLine1}
              style={{ width: "60%" }}
              name="addressLine1"
              onChange={(event) => { this.handleUpdate(event) }}
               />
          </FormItem>
          <FormItem
            {...formItemLayout}
            label={I18n.get("Address Line 2")}
          >
            <Input
              value={this.state.addressLine2}
              name="addressLine2"
              onChange={(event) => { this.handleUpdate(event) }}
              style={{ width: "60%" }} />
          </FormItem>
          <FormItem
            {...formItemLayout}
            label={I18n.get("City")}
          >
            <Input
              value={this.state.city}
              name="city"
              onChange={(event) => { this.handleUpdate(event) }}
              style={{ width: "60%" }} />
          </FormItem>

          <FormItem
            {...formItemLayout}
            label={I18n.get("State")}
          >
            <Input
              value={this.state.state}
              style={{ width: "60%" }}
              name="state"
              onChange={(event) => { this.handleUpdate(event) }}
              />
          </FormItem>
          <FormItem
            {...formItemLayout}
            label={I18n.get("Postal Code")}
          >
            <Input
              value={this.state.postalCode}
              name="postalCode"
              onChange={(event) => { this.handleUpdate(event) }}
              style={{ width: "60%" }} />
          </FormItem>
          <h2 style={{ marginLeft: "15%" }}>{I18n.get('Timeline')}:</h2>

          {/* timelines component */}
          {this.state.timeline.map(
            (element, index) => {
              index;
              return (
                <FormItem
                  {...formItemLayout}
                  key={index}
                  label={"Event" + " " + (index + 1)}
                >
                  {/* title input */}
                  <Input value={element.title}
                    id={index + "title"}
                    placeholder="Title"
                    key={index + "title"}
                    onChange={(event) => { this.handleTitleUpdate(event, index) }}
                    style={{ width: "60%" }}
                   >
                  </Input>
                  <Tooltip title="Delete">
                    <Button
                      onClick={() => { this.handleDeleteTimeline(index) }}>
                      <Icon style={{ fontSize: "15px", marginLeft: "1%" }} type="delete" />
                    </Button>
                  </Tooltip>

                  {/* textArea*/}
                  <Input.TextArea
                    value={element.info}
                    style={{ width: "60%" }}
                    rows={3}
                    onChange={(event) => { this.handleInfoUpdate(event, index) }}
                    name="description"
                    placeholder="Description" />
                  <br />

                  {/* datepicker */}
                  <DatePicker
                    onChange={(date,dateString) => { this.handleDateUpdate(dateString, index) }}
                    defaultValue={moment(element.date, 'YYYY-MM-DD')}
                    placeholder={I18n.get('Event Date')}
                    name="postDate" />
                </FormItem>)
            })}
          <div style={{ textAlign: "center" }} >
            <Button
              onClick ={this.handleAddTimeline}>
              <Icon type="plus" />
              {I18n.get('Add More Events')}
            </Button>
          </div>
        </Form>
      </Modal>
    );
  }
}

export default ModalForm;

