import { Link } from 'react-router-dom';
import { Feed } from 'semantic-ui-react';
import { Avatar, Button } from 'antd';
import moment from 'moment';

const SubscriptionRequiredNotification = ({ notification }) => {
  return (
    <Feed className="mt-2">
      <Feed.Event className="mb-3 ms-2">
        <Feed.Label>
          <Avatar>S</Avatar>
        </Feed.Label>
        <Feed.Content>
          <Feed.Summary className={notification.status === 'read' && 'text-muted'}>
            Your seller connections subscription is required to access potential buyers.{' '}
            <Link to="/seller/connections">
              <Button type="link" size="small">
                Subscribe
              </Button>
            </Link>
            <Feed.Date>{moment(notification.date).fromNow()}</Feed.Date>
          </Feed.Summary>
        </Feed.Content>
      </Feed.Event>
    </Feed>
  );
};

export default SubscriptionRequiredNotification;

