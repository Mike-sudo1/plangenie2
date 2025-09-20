import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

type InputCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

const InputCard = ({ title, description, children }: InputCardProps) => {
  return (
    <Card mode="elevated" style={styles.card} accessible accessibilityLabel={`${title} input`}>
      <Card.Content>
        <Text variant="titleMedium" style={styles.title}>
          {title}
        </Text>
        {description ? (
          <Text variant="bodySmall" style={styles.description}>
            {description}
          </Text>
        ) : null}
        <View style={styles.content}>{children}</View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    backgroundColor: '#fdf7ff',
  },
  title: {
    marginBottom: 4,
    color: '#5b4b8a',
  },
  description: {
    marginBottom: 12,
    color: '#6d5ca6',
  },
  content: {
    gap: 12,
  },
});

export default InputCard;
